"""Збирає дані хвилі з БД, рахує (scoring.py) і зберігає незмінні знімки."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Campaign,
    CampaignStatus,
    ChecklistEntry,
    ChecklistStatus,
    IndexSnapshot,
    Participation,
    QuestionnaireKind,
    RespondentCategory,
    Response,
    Role,
    Unit,
    User,
)
from app.services import facts as facts_service
from app.services import methodology as m
from app.services import scoring
from app.services.eligibility import is_eligible
from app.services.units import subtree_ids


def scope_units(db: Session, campaign: Campaign, unit_id: uuid.UUID | None) -> tuple[uuid.UUID, set[uuid.UUID]]:
    campaign_units = subtree_ids(db, campaign.unit_id)
    scope = unit_id or campaign.unit_id
    if scope not in campaign_units:
        raise ValueError("Підрозділ не входить у хвилю")
    return scope, subtree_ids(db, scope)


def load_groups(db: Session, campaign: Campaign, scope: uuid.UUID, units: set[uuid.UUID]) -> list[scoring.GroupInput]:
    at_root = scope == campaign.unit_id
    campaign_units = subtree_ids(db, campaign.unit_id)
    users = db.scalars(select(User).where(User.role == Role.RESPONDENT)).all()
    users_by_id = {u.id: u for u in users}

    def in_scope(category: RespondentCategory, unit: uuid.UUID | None) -> bool:
        if category == RespondentCategory.EXPERT:
            return at_root
        return unit in units

    responses = db.scalars(
        select(Response).where(Response.campaign_id == campaign.id).options(selectinload(Response.answers))
    ).all()
    participations = db.scalars(select(Participation).where(Participation.campaign_id == campaign.id)).all()

    groups = []
    for link in campaign.questionnaire_links:
        questionnaire = link.questionnaire
        if questionnaire.kind == QuestionnaireKind.CHECKLIST:
            continue
        # Експерти зовнішні: їхня оцінка стосується лише рівня всієї хвилі.
        if questionnaire.target_category == RespondentCategory.EXPERT and not at_root:
            continue
        eligible = sum(1 for u in users if is_eligible(u, questionnaire, campaign_units) and in_scope(u.category, u.unit_id))
        submitted = sum(
            1 for p in participations
            if p.questionnaire_id == questionnaire.id
            and (u := users_by_id.get(p.user_id)) is not None
            and in_scope(u.category, u.unit_id)
        )
        data = []
        for r in responses:
            if r.questionnaire_id != questionnaire.id or not in_scope(r.category, r.unit_id):
                continue
            item = scoring.ResponseData()
            for a in r.answers:
                if a.option_id is not None:
                    item.options.setdefault(a.question_id, []).append(a.option_id)
                elif a.value is not None:
                    item.values[a.question_id] = a.value
            data.append(item)
        groups.append(scoring.GroupInput(questionnaire=questionnaire, responses=data, eligible=eligible, submitted=submitted))
    return groups


def load_checklist(db: Session, campaign: Campaign, at_root: bool) -> list[scoring.ChecklistItem] | None:
    """Чек-лист оцінює заклад загалом, тому враховується лише на рівні всієї хвилі."""
    if not at_root:
        return None
    questionnaire = next(
        (link.questionnaire for link in campaign.questionnaire_links if link.questionnaire.kind == QuestionnaireKind.CHECKLIST),
        None,
    )
    if questionnaire is None:
        return None
    entries = {e.question_id: e for e in db.scalars(select(ChecklistEntry).where(ChecklistEntry.campaign_id == campaign.id))}
    items = []
    for section in questionnaire.sections:
        for q in section.questions:
            number = m.checklist_item_number(q.code) or q.code
            e = entries.get(q.id)
            score = None
            if e is not None:
                score = m.CHECKLIST_STATUS_SCORES[e.status.value]
                if e.status == ChecklistStatus.FULL and e.confirmed_by_id is None:
                    score = m.UNCONFIRMED_FULL_SCORE
            items.append(scoring.ChecklistItem(code=q.code, number=number, component=m.checklist_component(number),
                                               score=score, confirmed=bool(e and e.confirmed_by_id)))
    return items


def compute_for(db: Session, campaign: Campaign, unit_id: uuid.UUID | None) -> dict:
    """Розрахунок за поточною методикою (без збереження)."""
    scope, units = scope_units(db, campaign, unit_id)
    at_root = scope == campaign.unit_id
    groups = load_groups(db, campaign, scope, units)
    checklist = load_checklist(db, campaign, at_root)
    end = campaign.closed_on or date.today()
    periods = facts_service.months_back(end, m.FACTS_WINDOW_MONTHS)
    facts = facts_service.aggregate(db, units, periods, campaign.min_group_size)
    result = scoring.compute(groups, checklist, facts, campaign.min_group_size)
    unit = db.get(Unit, scope)
    return {
        "campaign_id": str(campaign.id),
        "campaign_title": campaign.title,
        "unit_id": str(scope),
        "unit_name": unit.name if unit else "",
        "closed_on": end.isoformat(),
        "min_group_size": campaign.min_group_size,
        "facts_period": f"з {periods[0]} по {periods[-1]}",
        **result,
    }


def jsonable(value):
    """UUID у рядки, щоб знімок можна було зберегти як JSON."""
    if isinstance(value, dict):
        return {k: jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [jsonable(v) for v in value]
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


def create_snapshots(db: Session, campaign: Campaign) -> int:
    """Знімки для підрозділу хвилі і всіх його дочірніх. Викликається при закритті."""
    count = 0
    for unit_id in subtree_ids(db, campaign.unit_id):
        payload = jsonable(compute_for(db, campaign, unit_id))
        db.add(
            IndexSnapshot(
                campaign_id=campaign.id,
                unit_id=unit_id,
                methodology_version=payload["methodology_version"],
                closed_on=campaign.closed_on,
                index_score=payload["index"]["score"],
                index_self=payload["index"]["self_score"],
                reliability=payload["index"]["reliability"],
                payload=payload,
            )
        )
        count += 1
    return count


def get_snapshot(db: Session, campaign_id: uuid.UUID, unit_id: uuid.UUID) -> IndexSnapshot | None:
    return db.scalar(select(IndexSnapshot).where(IndexSnapshot.campaign_id == campaign_id, IndexSnapshot.unit_id == unit_id))


def unit_snapshots(db: Session, unit_id: uuid.UUID) -> list[tuple[Campaign, IndexSnapshot]]:
    rows = db.execute(
        select(Campaign, IndexSnapshot)
        .join(IndexSnapshot, IndexSnapshot.campaign_id == Campaign.id)
        .where(IndexSnapshot.unit_id == unit_id, Campaign.status == CampaignStatus.CLOSED)
        .order_by(IndexSnapshot.closed_on, Campaign.created_at)
    ).all()
    return [(c, s) for c, s in rows]


def delta(a, b):
    return None if a is None or b is None else round(a - b, 1)


def compare_payloads(before: dict, after: dict) -> dict:
    """Порівняння двох знімків одного підрозділу з правилом значущості."""
    rel = [before["index"]["reliability"], after["index"]["reliability"]]
    index_delta = delta(after["index"]["score"], before["index"]["score"])
    prev_c = {c["code"]: c for c in before["components"]}
    components = []
    for c in after["components"]:
        p = prev_c.get(c["code"], {})
        d = delta(c["score"], p.get("score"))
        components.append({
            "code": c["code"], "title": c["title"], "previous": p.get("score"), "current": c["score"], "delta": d,
            "significance": m.significance(d, [p.get("reliability"), c["reliability"]]),
        })
    prev_q = {q["code"]: q["score"] for q in before.get("questions", [])}
    return {
        "previous_campaign_id": before["campaign_id"],
        "previous_title": before["campaign_title"],
        "previous_closed_on": before["closed_on"],
        "previous_index": before["index"]["score"],
        "previous_reliability": before["index"]["reliability"],
        "index_delta": index_delta,
        "index_self_delta": delta(after["index"]["self_score"], before["index"]["self_score"]),
        "index_significance": m.significance(index_delta, rel),
        "components": components,
        "questions": [
            {"code": q["code"], "previous": prev_q[q["code"]], "current": q["score"], "delta": delta(q["score"], prev_q[q["code"]])}
            for q in after.get("questions", []) if q["code"] in prev_q
        ],
        "methodology_versions": [before["methodology_version"], after["methodology_version"]],
        "rule": f"Зміна менша за {m.SIGNIFICANT_DELTA:g} балів: в межах похибки. Якщо одна з хвиль має достовірність C: перевірити дані. Питання зіставляються за кодом.",
    }


def results_for(db: Session, campaign: Campaign, unit_id: uuid.UUID | None, recalculate: bool = False) -> dict:
    """Результати хвилі: зі знімка або, на вимогу, перераховані за поточною методикою."""
    scope, _ = scope_units(db, campaign, unit_id)
    snapshot = None if recalculate else get_snapshot(db, campaign.id, scope)
    if snapshot is not None:
        payload = dict(snapshot.payload)
        source = "snapshot"
    else:
        payload = jsonable(compute_for(db, campaign, scope))
        source = "recalculated" if recalculate else "live"

    history = unit_snapshots(db, scope)
    previous = None
    for c, s in history:
        if c.id == campaign.id:
            break
        previous = s
    dyn = compare_payloads(previous.payload, payload) if previous is not None else None
    return {**payload, "source": source, "dynamics": dyn, "summary": scoring.management_summary(payload, dyn)}

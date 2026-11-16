"""Прийом фактів з інших систем і їх перегляд.

Передаються лише агрегати "X з Y". Будь-яке зайве поле (наприклад, ім'я
людини) відхиляється з 422.
"""

import hmac
import re
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit import log_action
from app.config import get_settings
from app.db import get_db
from app.models import Indicator, Role, Unit, User
from app.security import get_current_user, require_roles
from app.services import facts, methodology as m
from app.services.units import subtree_ids

router = APIRouter(tags=["indicators"])
optional_token = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class IndicatorIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    unit_id: uuid.UUID
    period: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="Місяць у форматі YYYY-MM")
    indicator: str
    numerator: int = Field(ge=0)
    denominator: int = Field(ge=0)
    source: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9_.-]+$")
    why: str = Field(default="", max_length=1000)
    extra_counts: dict[str, int] = Field(default_factory=dict, description="Лише для показу, на бал не впливає")

    @field_validator("indicator")
    @classmethod
    def known_indicator(cls, value: str) -> str:
        if value not in m.FACTS:
            raise ValueError(f"Невідомий показник. Дозволені: {', '.join(m.FACTS)}")
        return value

    @field_validator("extra_counts")
    @classmethod
    def plain_counts(cls, value: dict[str, int]) -> dict[str, int]:
        if len(value) > 10:
            raise ValueError("Не більше 10 додаткових лічильників")
        for key, count in value.items():
            if not re.fullmatch(r"[a-z_]{1,32}", key) or count < 0:
                raise ValueError("Ключі лише латиницею (a-z, _), значення лише невід'ємні цілі")
        return value

    @model_validator(mode="after")
    def numerator_not_above_denominator(self):
        if self.numerator > self.denominator:
            raise ValueError("numerator не може бути більшим за denominator")
        return self


class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    unit_id: uuid.UUID
    period: str
    indicator: str
    numerator: int
    denominator: int
    source: str
    why: str
    extra_counts: dict


class FactOut(BaseModel):
    indicator: str
    title: str
    component: str
    periods: str
    sources: list[str]
    status: str  # ok / too_few_people / no_denominator
    numerator: int | None
    denominator: int | None
    percent: float | None
    level: int | None
    score: float | None
    extra_counts: dict
    label: str
    rule: str


class RiskSignal(BaseModel):
    indicator: str
    title: str
    status: str
    found: int | None
    handled: int | None
    pending: int | None
    previous_found: int | None
    change: int | None
    extra_counts: dict


def integration_or_admin(
    token: str | None = Depends(optional_token),
    x_integration_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """Факти може передавати інша система (ключ інтеграції) або адмін."""
    key = get_settings().integration_api_key
    if x_integration_key:
        if key and hmac.compare_digest(x_integration_key, key):
            return None
        raise HTTPException(status_code=401, detail="Невірний ключ інтеграції")
    if token is None:
        raise HTTPException(status_code=401, detail="Потрібна авторизація")
    user = get_current_user(token, db)
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Недостатньо прав")
    return user


@router.post("/indicators", response_model=IndicatorOut, status_code=status.HTTP_201_CREATED)
def post_indicator(data: IndicatorIn, db: Session = Depends(get_db), actor: User | None = Depends(integration_or_admin)):
    """Приймає або оновлює факт за місяць (одна пара підрозділ + місяць + показник)."""
    if db.get(Unit, data.unit_id) is None:
        raise HTTPException(status_code=422, detail="Підрозділ не знайдено")
    row = db.scalar(
        select(Indicator).where(
            Indicator.unit_id == data.unit_id, Indicator.period == data.period, Indicator.indicator == data.indicator
        )
    )
    if row is None:
        row = Indicator(unit_id=data.unit_id, period=data.period, indicator=data.indicator)
        db.add(row)
    for field in ("numerator", "denominator", "source", "why", "extra_counts"):
        setattr(row, field, getattr(data, field))
    db.flush()
    log_action(db, actor, "upsert", "indicator", row.id,
               {"indicator": data.indicator, "period": data.period, "source": data.source})
    db.commit()
    return row


def check_unit(db: Session, unit_id: uuid.UUID) -> Unit:
    unit = db.get(Unit, unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Підрозділ не знайдено")
    return unit


@router.get("/units/{unit_id}/indicators", response_model=list[FactOut])
def unit_facts(
    unit_id: uuid.UUID,
    months: int = Query(default=12, description="3, 6 або 12"),
    end: date | None = Query(default=None, description="Останній місяць періоду, за замовчуванням поточний"),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN, Role.COMMISSIONER)),
):
    """Факти підрозділу (разом із дочірніми) у форматі 'X з Y'."""
    if months not in (3, 6, 12):
        raise HTTPException(status_code=422, detail="months: 3, 6 або 12")
    check_unit(db, unit_id)
    periods = facts.months_back(end or date.today(), months)
    return facts.aggregate(db, subtree_ids(db, unit_id), periods, get_settings().default_min_group_size)


@router.get("/units/{unit_id}/risk-signals", response_model=list[RiskSignal])
def risk_signals(
    unit_id: uuid.UUID,
    months: int = Query(default=3, description="3, 6 або 12"),
    end: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN, Role.COMMISSIONER)),
):
    """Панель ризик-сигналів: сирі кількості знайденого і їх зміна до попереднього періоду.

    На індекс не впливає: кількість знайдених проблем не є поганою оцінкою.
    """
    if months not in (3, 6, 12):
        raise HTTPException(status_code=422, detail="months: 3, 6 або 12")
    check_unit(db, unit_id)
    end = end or date.today()
    current = facts.months_back(end, months)
    prev_end_year, prev_end_month = int(current[0][:4]), int(current[0][5:])
    prev_end_month -= 1
    if prev_end_month == 0:
        prev_end_year, prev_end_month = prev_end_year - 1, 12
    previous = facts.months_back(date(prev_end_year, prev_end_month, 1), months)
    k = get_settings().default_min_group_size
    units = subtree_ids(db, unit_id)
    now = {f["indicator"]: f for f in facts.aggregate(db, units, current, k)}
    before = {f["indicator"]: f for f in facts.aggregate(db, units, previous, k)}

    signals = []
    for code in ("coi_reviewed", "procurement_flags_reviewed", "reports_handled"):
        f = now.get(code)
        if f is None:
            continue
        prev = before.get(code)
        found = f["denominator"]
        prev_found = prev["denominator"] if prev else None
        signals.append(
            RiskSignal(
                indicator=code,
                title=m.FACTS[code]["title"],
                status=f["status"],
                found=found,
                handled=f["numerator"],
                pending=None if found is None else found - f["numerator"],
                previous_found=prev_found,
                change=None if found is None or prev_found is None else found - prev_found,
                extra_counts=f["extra_counts"],
            )
        )
    return signals

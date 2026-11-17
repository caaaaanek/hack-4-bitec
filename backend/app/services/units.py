import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Unit


def subtree_ids(db: Session, root_id: uuid.UUID) -> set[uuid.UUID]:
    """ID підрозділу і всіх його дочірніх підрозділів на будь-якій глибині."""
    children: dict[uuid.UUID | None, list[uuid.UUID]] = {}
    for unit_id, parent_id in db.execute(select(Unit.id, Unit.parent_id)):
        children.setdefault(parent_id, []).append(unit_id)

    result: set[uuid.UUID] = set()
    stack = [root_id]
    while stack:
        current = stack.pop()
        if current in result:
            continue
        result.add(current)
        stack.extend(children.get(current, []))
    return result

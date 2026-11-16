from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, User


def log_action(
    db: Session,
    actor: User | None,
    action: str,
    entity: str,
    entity_id: Any = None,
    details: dict | None = None,
) -> None:
    """Додає запис у журнал. Комітить той, хто викликав, разом з основною зміною."""
    db.add(
        AuditLog(
            actor_id=actor.id if actor else None,
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            details=details or {},
        )
    )

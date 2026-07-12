"""Append-only activity trail (Person D). One call, reusable by any router
(A/B/C too — same spirit as core/rbac.py's require_role):

    from app.services.activity import log_activity
    log_activity(db, actor_id=user.id, action="maintenance.approved",
                 entity_type="maintenance_request", entity_id=request.id,
                 details=f"Approved by {user.name}")

Doesn't commit — callers already commit the surrounding transaction, and a
log entry should never survive a rolled-back one.
"""

from app.models.activity_log import ActivityLog


def log_activity(
    db,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int,
    details: str | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    return entry

"""Read-only activity feed (Person D). Screen 10's other half — see
services/activity.py for how other routers write into it."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.employee import Employee
from app.schemas.notification import ActivityLogOut

router = APIRouter(prefix="/activity-log", tags=["activity-log"])


@router.get("", response_model=list[ActivityLogOut])
def list_activity(
    limit: int = 50,
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(min(limit, 200)).all()
    )
    return [
        ActivityLogOut(
            id=e.id,
            actor_id=e.actor_id,
            actor_name=e.actor.name if e.actor else None,
            action=e.action,
            entity_type=e.entity_type,
            entity_id=e.entity_id,
            details=e.details,
            timestamp=e.timestamp,
        )
        for e in entries
    ]

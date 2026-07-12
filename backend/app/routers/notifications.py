"""Notifications — Screen 10's filter tabs (All/Alerts/Approvals/Bookings),
plus persisted mark-as-read (Person D).

Every list fetch runs the overdue-allocation sweep first for the requesting
user, so "Reserved is derived, don't hand-maintain" pattern (Person B's
booking service) extends to overdue-return alerts too — no cron needed.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.employee import Employee
from app.models.enums import NotificationCategory
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, UnreadCountOut
from app.services.notifications import sweep_overdue_allocations

router = APIRouter(prefix="/notifications", tags=["notifications"])

_VALID_CATEGORIES = {c.value for c in NotificationCategory}


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    category: str | None = None,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if category is not None and category not in _VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"category must be one of {sorted(_VALID_CATEGORIES)}",
        )

    sweep_overdue_allocations(db, user.id)
    db.commit()

    q = db.query(Notification).filter(Notification.employee_id == user.id)
    if category is not None:
        q = q.filter(Notification.category == category)
    return q.order_by(Notification.created_at.desc()).all()


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(Notification.employee_id == user.id)
        .filter(Notification.is_read.is_(False))
        .count()
    )
    return UnreadCountOut(unread=count)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.get(Notification, notification_id)
    if n is None:
        raise HTTPException(status_code=404, detail="Notification not found.")
    if n.employee_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your notification.",
        )
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.patch("/read-all", response_model=list[NotificationOut])
def mark_all_read(
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unread = (
        db.query(Notification)
        .filter(Notification.employee_id == user.id)
        .filter(Notification.is_read.is_(False))
        .all()
    )
    for n in unread:
        n.is_read = True
    db.commit()
    return (
        db.query(Notification)
        .filter(Notification.employee_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

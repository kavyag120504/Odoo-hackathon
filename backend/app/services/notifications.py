"""Notification firing (Person D). One call, reusable by any router:

    from app.services.notifications import notify
    notify(db, employee_id=request.raised_by_id, title="Request approved",
           message=f"Your request for {asset.name} was approved.",
           category=NotificationCategory.APPROVAL.value)

Doesn't commit — callers already commit the surrounding transaction.

sweep_overdue_allocations() is the "derive, don't hand-maintain" piece: there's
no cron here, so instead of a background job it's run inline whenever a user's
notification feed is fetched (see routers/notifications.py). It's idempotent —
re-running it never double-fires the same allocation, matched by a stable
title so a re-sweep before the allocation is returned is a no-op.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.allocation import Allocation
from app.models.enums import AllocationStatus, NotificationCategory
from app.models.notification import Notification


def notify(
    db: Session,
    employee_id: int,
    title: str,
    message: str,
    category: str = NotificationCategory.ALERT.value,
) -> Notification:
    n = Notification(
        employee_id=employee_id,
        title=title,
        message=message,
        category=category,
    )
    db.add(n)
    return n


def _overdue_title(allocation: Allocation) -> str:
    return f"Overdue return — {allocation.asset.name} (allocation #{allocation.id})"


def sweep_overdue_allocations(db: Session, employee_id: int, now: datetime | None = None) -> list[Notification]:
    """Find `employee_id`'s Active allocations past their expected_return_date
    and notify them exactly once each. Safe to call on every notifications
    fetch — the title match makes it a no-op once the notification exists."""
    now = now or datetime.utcnow()
    overdue = (
        db.query(Allocation)
        .filter(Allocation.employee_id == employee_id)
        .filter(Allocation.status == AllocationStatus.ACTIVE.value)
        .filter(Allocation.expected_return_date.isnot(None))
        .filter(Allocation.expected_return_date < now)
        .all()
    )
    if not overdue:
        return []

    already_notified = {
        title
        for (title,) in db.query(Notification.title)
        .filter(Notification.employee_id == employee_id)
        .filter(Notification.category == NotificationCategory.ALERT.value)
        .all()
    }

    fired = []
    for allocation in overdue:
        title = _overdue_title(allocation)
        if title in already_notified:
            continue
        days_over = (now - allocation.expected_return_date).days
        n = notify(
            db,
            employee_id=employee_id,
            title=title,
            message=(
                f"{allocation.asset.name} was due back "
                f"{days_over} day{'s' if days_over != 1 else ''} ago."
            ),
            category=NotificationCategory.ALERT.value,
        )
        fired.append(n)
    return fired

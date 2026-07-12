"""Dashboard KPI wiring (Person D) — live queries only, nothing hand-maintained.

Reuses Person B's booking service read-only for the same "derive, don't
hand-maintain" reason it exists there: an asset's Reserved state and a
booking's Upcoming/Ongoing/Completed state are computed from the clock, not
stored, so the dashboard has to ask the same functions the Booking screen
does or the two would drift apart.
"""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.allocation import Allocation
from app.models.asset import Asset
from app.models.booking import Booking
from app.models.employee import Employee
from app.models.enums import AllocationStatus, BookingStatus
from app.models.maintenance_request import MaintenanceRequest
from app.models.notification import Notification
from app.schemas.dashboard import DashboardSummaryOut
from app.schemas.notification import ActivityLogOut
from app.services.booking import computed_booking_status, effective_asset_status

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryOut)
def summary(
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    assets = db.query(Asset).all()
    assets_by_status: dict[str, int] = {}
    for a in assets:
        live_status = effective_asset_status(db, a, now)
        assets_by_status[live_status] = assets_by_status.get(live_status, 0) + 1

    active_allocations = (
        db.query(Allocation).filter(Allocation.status == AllocationStatus.ACTIVE.value).count()
    )
    overdue_allocations = (
        db.query(Allocation)
        .filter(Allocation.status == AllocationStatus.ACTIVE.value)
        .filter(Allocation.expected_return_date.isnot(None))
        .filter(Allocation.expected_return_date < now)
        .count()
    )

    upcoming_bookings = 0
    ongoing_bookings = 0
    for b in db.query(Booking).filter(Booking.status != BookingStatus.CANCELLED.value).all():
        live = computed_booking_status(b, now)
        if live == BookingStatus.UPCOMING.value:
            upcoming_bookings += 1
        elif live == BookingStatus.ONGOING.value:
            ongoing_bookings += 1

    maintenance_by_status: dict[str, int] = {}
    open_maintenance = 0
    for m in db.query(MaintenanceRequest).all():
        maintenance_by_status[m.status] = maintenance_by_status.get(m.status, 0) + 1
        if m.status not in ("Resolved", "Rejected"):
            open_maintenance += 1

    unread_notifications = (
        db.query(Notification)
        .filter(Notification.employee_id == user.id)
        .filter(Notification.is_read.is_(False))
        .count()
    )

    recent = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()

    return DashboardSummaryOut(
        assets_total=len(assets),
        assets_by_status=assets_by_status,
        active_allocations=active_allocations,
        overdue_allocations=overdue_allocations,
        upcoming_bookings=upcoming_bookings,
        ongoing_bookings=ongoing_bookings,
        maintenance_by_status=maintenance_by_status,
        open_maintenance=open_maintenance,
        unread_notifications=unread_notifications,
        recent_activity=[
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
            for e in recent
        ],
    )

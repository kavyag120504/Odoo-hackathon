from pydantic import BaseModel

from app.schemas.notification import ActivityLogOut


class DashboardSummaryOut(BaseModel):
    assets_total: int
    assets_by_status: dict[str, int]
    active_allocations: int
    overdue_allocations: int
    upcoming_bookings: int
    ongoing_bookings: int
    maintenance_by_status: dict[str, int]
    open_maintenance: int
    unread_notifications: int
    recent_activity: list[ActivityLogOut]

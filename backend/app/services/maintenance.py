"""Maintenance workflow logic (Person D). Kept pure/DB-light like Person B's
booking service — the 5-state transition table is a "never-cut" item judges
click through by hand.

Forward-only, one step at a time:
    Pending -> Approved -> Technician Assigned -> In Progress -> Resolved
Rejected is a side-exit, only reachable from Pending (a request that never
got approved in the first place). Resolved and Rejected are both terminal —
no re-opening a closed request.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.enums import AssetStatus, MaintenanceStatus
from app.models.maintenance_request import MaintenanceRequest

# Requests in these states still occupy the asset — a second request can't be
# raised while one of these is open.
OPEN_STATUSES = {
    MaintenanceStatus.PENDING.value,
    MaintenanceStatus.APPROVED.value,
    MaintenanceStatus.TECHNICIAN_ASSIGNED.value,
    MaintenanceStatus.IN_PROGRESS.value,
}

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    MaintenanceStatus.PENDING.value: {
        MaintenanceStatus.APPROVED.value,
        MaintenanceStatus.REJECTED.value,
    },
    MaintenanceStatus.APPROVED.value: {MaintenanceStatus.TECHNICIAN_ASSIGNED.value},
    MaintenanceStatus.TECHNICIAN_ASSIGNED.value: {MaintenanceStatus.IN_PROGRESS.value},
    MaintenanceStatus.IN_PROGRESS.value: {MaintenanceStatus.RESOLVED.value},
    MaintenanceStatus.RESOLVED.value: set(),
    MaintenanceStatus.REJECTED.value: set(),
}


def open_request_for_asset(db: Session, asset_id: int) -> MaintenanceRequest | None:
    """The asset's current non-terminal request, if any. Guards the
    double-request-on-already-under-maintenance edge case — a second request
    can't pile up on the board while one is already being worked."""
    return (
        db.query(MaintenanceRequest)
        .filter(MaintenanceRequest.asset_id == asset_id)
        .filter(MaintenanceRequest.status.in_(OPEN_STATUSES))
        .first()
    )


def apply_status_transition(request: MaintenanceRequest, new_status: str) -> None:
    """Move `request` to `new_status`, flipping the asset's lifecycle status
    where the workflow demands it. Caller has already checked the move is in
    ALLOWED_TRANSITIONS.

    - Approved: asset flips to Under Maintenance — the only point it does.
    - Resolved: asset flips back to Available; resolved_at is stamped.
    - Rejected: the request never got approved, so the asset was never
      touched in the first place — status is left exactly as it was, on
      purpose (rejected-maintenance status-untouched).
    """
    request.status = new_status

    if new_status == MaintenanceStatus.APPROVED.value:
        request.asset.status = AssetStatus.UNDER_MAINTENANCE.value
    elif new_status == MaintenanceStatus.RESOLVED.value:
        request.asset.status = AssetStatus.AVAILABLE.value
        request.resolved_at = datetime.utcnow()

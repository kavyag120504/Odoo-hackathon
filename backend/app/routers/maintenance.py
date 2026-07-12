"""Maintenance requests — 5-state kanban workflow (Person D).

Commit 1: raise a request, list the board, and walk a request through the
workflow one step at a time. Any authenticated employee can raise a request
(spec: "Employee ... raises maintenance requests"); only an Asset Manager (or
Admin, via require_role's built-in superset) can move it — that's the
approve/assign/progress/resolve/reject authority the spec gives them.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.asset import Asset
from app.models.employee import Employee, Role
from app.models.enums import AssetStatus, MaintenanceStatus
from app.models.maintenance_request import MaintenanceRequest
from app.schemas.maintenance import (
    MaintenanceAssetOut,
    MaintenanceCreate,
    MaintenanceOut,
    MaintenanceStatusUpdate,
)
from app.services.maintenance import (
    ALLOWED_TRANSITIONS,
    apply_status_transition,
    open_request_for_asset,
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def _out(request: MaintenanceRequest) -> MaintenanceOut:
    return MaintenanceOut(
        id=request.id,
        asset_id=request.asset_id,
        asset_name=request.asset.name,
        asset_tag=request.asset.asset_tag,
        raised_by_id=request.raised_by_id,
        raised_by_name=request.raised_by.name if request.raised_by else None,
        description=request.description,
        priority=request.priority,
        photo_url=request.photo_url,
        status=request.status,
        assigned_to_id=request.assigned_to_id,
        assigned_to_name=request.assigned_to.name if request.assigned_to else None,
        approved_by_id=request.approved_by_id,
        resolved_at=request.resolved_at,
        created_at=request.created_at,
    )


@router.get("/assets", response_model=list[MaintenanceAssetOut])
def list_assets_for_request(
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Minimal asset picker for the raise-request form. Deliberately scoped to
    this router instead of a general /assets endpoint — Person C's Asset
    Registry API isn't built yet, and this screen shouldn't block on it."""
    return db.query(Asset).order_by(Asset.asset_tag).all()


@router.get("", response_model=list[MaintenanceOut])
def list_requests(
    status_filter: str | None = None,
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(MaintenanceRequest)
    if status_filter:
        q = q.filter(MaintenanceRequest.status == status_filter)
    requests = q.order_by(MaintenanceRequest.created_at.desc()).all()
    return [_out(r) for r in requests]


@router.post("", response_model=MaintenanceOut, status_code=status.HTTP_201_CREATED)
def raise_request(
    payload: MaintenanceCreate,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, payload.asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")

    # Edge case: asset already under maintenance -> block outright, even if
    # (for some reason) it has no open request row pointing at it.
    if asset.status == AssetStatus.UNDER_MAINTENANCE.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{asset.name}' is already under maintenance.",
        )

    # Edge case: asset already has an open (non-terminal) request -> block the
    # second one instead of letting duplicates pile up on the board.
    existing = open_request_for_asset(db, asset.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"'{asset.name}' already has an open maintenance request "
                f"(#{existing.id}, {existing.status})."
            ),
        )

    request = MaintenanceRequest(
        asset_id=asset.id,
        raised_by_id=user.id,
        description=payload.description,
        priority=payload.priority,
        photo_url=payload.photo_url,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return _out(request)


@router.patch(
    "/{request_id}/status",
    response_model=MaintenanceOut,
    dependencies=[Depends(require_role(Role.ASSET_MANAGER))],
)
def update_status(
    request_id: int,
    payload: MaintenanceStatusUpdate,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request = db.get(MaintenanceRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Maintenance request not found.")

    allowed_next = ALLOWED_TRANSITIONS.get(request.status, set())
    if payload.status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot move from '{request.status}' to '{payload.status}'.",
        )

    if payload.status == MaintenanceStatus.TECHNICIAN_ASSIGNED.value:
        if payload.assigned_to_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="assigned_to_id is required to assign a technician.",
            )
        technician = db.get(Employee, payload.assigned_to_id)
        if technician is None:
            raise HTTPException(status_code=404, detail="Assignee not found.")
        request.assigned_to_id = technician.id

    if payload.status == MaintenanceStatus.APPROVED.value:
        request.approved_by_id = user.id

    apply_status_transition(request, payload.status)
    db.commit()
    db.refresh(request)
    return _out(request)

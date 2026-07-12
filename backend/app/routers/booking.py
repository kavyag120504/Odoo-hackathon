"""Resource booking (Person B).

Commit 3: create + list + the guard rails —
  - asset must exist and be is_bookable
  - asset status must not be terminal/unavailable (Under Maintenance/Lost/Retired/Disposed)
  - the requested window must not overlap an active booking (boundary-safe)

Commit 4 adds status transitions, live Reserved derivation, and cancel.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.asset import Asset
from app.models.booking import Booking
from app.models.employee import Employee
from app.models.enums import BLOCKED_FOR_BOOKING, BookingStatus
from app.schemas.booking import BookingCreate, BookingOut
from app.services.booking import find_conflict

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingOut])
def list_bookings(
    asset_id: int | None = None,
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Booking)
    if asset_id is not None:
        q = q.filter(Booking.asset_id == asset_id)
    return q.order_by(Booking.start_time).all()


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    asset = db.get(Asset, payload.asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found.")

    # 1) must be a bookable resource
    if not asset.is_bookable:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{asset.name}' is not a bookable resource.",
        )

    # 2) lifecycle state must allow booking (blocked regardless of slot)
    if asset.status in BLOCKED_FOR_BOOKING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot book — asset is {asset.status}.",
        )

    # 3) no overlap with an active booking (back-to-back is allowed)
    conflict = find_conflict(db, asset.id, payload.start_time, payload.end_time)
    if conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Conflict — slot is unavailable "
                f"({conflict.start_time:%H:%M}–{conflict.end_time:%H:%M} already booked)."
            ),
        )

    booking = Booking(
        asset_id=asset.id,
        booked_by_id=user.id,  # Person A's column name
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=BookingStatus.UPCOMING.value,
        purpose=payload.purpose,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

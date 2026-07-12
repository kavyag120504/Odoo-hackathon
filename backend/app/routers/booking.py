"""Resource booking (Person B).

Commit 3: create + list + guard rails (bookable? blocked status? overlap?).
Commit 4: live status derivation, cancel (frees the slot), and the Reserved
          asset-state derived live from the bookings table.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.asset import Asset
from app.models.booking import Booking
from app.models.employee import Employee, Role
from app.models.enums import BLOCKED_FOR_BOOKING, BookingStatus
from app.schemas.booking import AssetBookingStatusOut, BookingCreate, BookingOut
from app.services.booking import (
    computed_booking_status,
    effective_asset_status,
    find_conflict,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])

_CAN_CANCEL_ANY = {Role.ASSET_MANAGER.value, Role.ADMIN.value}


def _out(booking: Booking) -> BookingOut:
    """Serialize with the live-derived effective status alongside the stored one."""
    out = BookingOut.model_validate(booking)
    out.effective_status = computed_booking_status(booking)
    return out


@router.get("", response_model=list[BookingOut])
def list_bookings(
    asset_id: int | None = None,
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Booking)
    if asset_id is not None:
        q = q.filter(Booking.asset_id == asset_id)
    return [_out(b) for b in q.order_by(Booking.start_time).all()]


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
    return _out(booking)


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a booking. The slot frees immediately — find_conflict ignores
    Cancelled bookings, so a new booking can land in the freed window right away.
    Allowed for the booker, or an Asset Manager / Admin."""
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found.")

    if booking.booked_by_id != user.id and user.role not in _CAN_CANCEL_ANY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the booker or an Asset Manager can cancel this booking.",
        )

    if booking.status == BookingStatus.CANCELLED.value:
        raise HTTPException(status_code=409, detail="Booking is already cancelled.")

    # Can't cancel a booking whose window has already ended.
    if computed_booking_status(booking) == BookingStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot cancel a completed booking.",
        )

    booking.status = BookingStatus.CANCELLED.value
    db.commit()
    db.refresh(booking)
    return _out(booking)


@router.get("/asset-statuses", response_model=list[AssetBookingStatusOut])
def asset_booking_statuses(
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bookable assets with their live lifecycle status — proves Reserved is
    derived from the bookings table, not a stored flag. Powers the registry /
    dashboard 'Reserved' badge without any drift."""
    assets = db.query(Asset).filter(Asset.is_bookable.is_(True)).order_by(Asset.id).all()
    return [
        AssetBookingStatusOut(
            asset_id=a.id,
            name=a.name,
            asset_tag=a.asset_tag,
            stored_status=a.status,
            effective_status=effective_asset_status(db, a),
            is_bookable=a.is_bookable,
        )
        for a in assets
    ]

"""Booking business logic (Person B). Kept pure/DB-light so the overlap rule is
unit-testable in isolation — it's a "never-cut" item judges test by hand.

Overlap rule (half-open intervals): two windows conflict iff
    new.start < existing.end  AND  new.end > existing.start
This makes back-to-back bookings valid on purpose: 9-10 booked, 9:30-10:30
conflicts, 10:00-11:00 does NOT (10:00 is not < 10:00).
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.booking import Booking
from app.models.enums import ACTIVE_BOOKING_STATUSES, AssetStatus, BookingStatus


def intervals_overlap(
    new_start: datetime, new_end: datetime, exist_start: datetime, exist_end: datetime
) -> bool:
    return new_start < exist_end and new_end > exist_start


def computed_booking_status(booking: Booking, now: datetime | None = None) -> str:
    """Live-derive a booking's display status from the clock — no cron needed.
    Cancelled is the only explicitly-stored state; the rest fall out of time:
      now < start -> Upcoming | start <= now < end -> Ongoing | now >= end -> Completed
    This is the same "derive, don't hand-maintain" rule we use for Reserved."""
    if booking.status == BookingStatus.CANCELLED.value:
        return BookingStatus.CANCELLED.value
    now = now or datetime.utcnow()
    if now < booking.start_time:
        return BookingStatus.UPCOMING.value
    if booking.start_time <= now < booking.end_time:
        return BookingStatus.ONGOING.value
    return BookingStatus.COMPLETED.value


def asset_has_active_booking(
    db: Session, asset_id: int, now: datetime | None = None
) -> bool:
    """True if the asset has an ongoing or upcoming (not Cancelled, not ended)
    booking — i.e. the booking table says it's Reserved."""
    now = now or datetime.utcnow()
    return (
        db.query(Booking)
        .filter(Booking.asset_id == asset_id)
        .filter(Booking.status != BookingStatus.CANCELLED.value)
        .filter(Booking.end_time > now)
        .first()
        is not None
    )


def effective_asset_status(db: Session, asset: Asset, now: datetime | None = None) -> str:
    """The asset's live lifecycle status. Reserved is DERIVED from the bookings
    table, never stored on the asset — so it can't drift. Hard states
    (Allocated / Under Maintenance / Lost / Retired / Disposed) always win; only
    an otherwise-Available asset flips to Reserved when it has an active booking."""
    if asset.status != AssetStatus.AVAILABLE.value:
        return asset.status
    if asset_has_active_booking(db, asset.id, now):
        return AssetStatus.RESERVED.value
    return AssetStatus.AVAILABLE.value


def find_conflict(
    db: Session,
    asset_id: int,
    start: datetime,
    end: datetime,
    exclude_booking_id: int | None = None,
) -> Booking | None:
    """Return the first active booking on `asset_id` that overlaps [start, end),
    or None. Only Upcoming/Ongoing bookings hold a slot — Completed/Cancelled
    free it, so a freed slot is immediately re-bookable."""
    q = (
        db.query(Booking)
        .filter(Booking.asset_id == asset_id)
        .filter(Booking.status.in_(ACTIVE_BOOKING_STATUSES))
    )
    if exclude_booking_id is not None:
        q = q.filter(Booking.id != exclude_booking_id)

    for existing in q.all():
        if intervals_overlap(start, end, existing.start_time, existing.end_time):
            return existing
    return None

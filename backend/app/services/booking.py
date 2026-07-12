"""Booking business logic (Person B). Kept pure/DB-light so the overlap rule is
unit-testable in isolation — it's a "never-cut" item judges test by hand.

Overlap rule (half-open intervals): two windows conflict iff
    new.start < existing.end  AND  new.end > existing.start
This makes back-to-back bookings valid on purpose: 9-10 booked, 9:30-10:30
conflicts, 10:00-11:00 does NOT (10:00 is not < 10:00).
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.enums import ACTIVE_BOOKING_STATUSES


def intervals_overlap(
    new_start: datetime, new_end: datetime, exist_start: datetime, exist_end: datetime
) -> bool:
    return new_start < exist_end and new_end > exist_start


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

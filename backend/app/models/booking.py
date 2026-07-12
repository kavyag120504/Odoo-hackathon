from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BookingStatus


class Booking(Base):
    """Resource booking with time-slot overlap validation. Reserved state computed from this."""

    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    booked_by_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=BookingStatus.UPCOMING.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    asset = relationship("Asset", back_populates="bookings")
    booked_by = relationship("Employee", foreign_keys=[booked_by_id])

    __table_args__ = (
        CheckConstraint(
            "status in ('Upcoming','Ongoing','Completed','Cancelled')",
            name="ck_booking_status",
        ),
        CheckConstraint(
            "end_time > start_time", name="ck_booking_time_range"
        ),
    )

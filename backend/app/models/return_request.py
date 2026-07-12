from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import ReturnStatus


class ReturnRequest(Base):
    """Two-step return: Employee initiates → Asset Manager approves with condition notes."""

    __tablename__ = "return_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    allocation_id: Mapped[int] = mapped_column(
        ForeignKey("allocations.id", ondelete="CASCADE"), nullable=False
    )
    requested_by_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    employee_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    manager_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ReturnStatus.REQUESTED.value
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    allocation = relationship("Allocation", back_populates="return_requests")
    requested_by = relationship("Employee", foreign_keys=[requested_by_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])

    __table_args__ = (
        CheckConstraint(
            "status in ('Requested','Approved')", name="ck_return_status"
        ),
    )

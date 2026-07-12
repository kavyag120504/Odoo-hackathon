from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import AllocationStatus


class Allocation(Base):
    """Asset allocation to employee or department. Two-step return flow."""

    __tablename__ = "allocations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    # Either employee_id OR department_id must be set (at least one non-null).
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    allocated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    expected_return_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_return_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AllocationStatus.ACTIVE.value
    )

    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("Employee", foreign_keys=[employee_id])
    department = relationship("Department", foreign_keys=[department_id])
    return_requests = relationship("ReturnRequest", back_populates="allocation")

    __table_args__ = (
        CheckConstraint(
            "status in ('Active','Returned')", name="ck_allocation_status"
        ),
    )

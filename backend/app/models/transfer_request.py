from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import TransferStatus


class TransferRequest(Base):
    """Transfer asset from one employee to another. Approved by Asset Manager or Dept Head."""

    __tablename__ = "transfer_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    from_employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    to_employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=TransferStatus.REQUESTED.value
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    asset = relationship("Asset", back_populates="transfer_requests")
    from_employee = relationship("Employee", foreign_keys=[from_employee_id])
    to_employee = relationship("Employee", foreign_keys=[to_employee_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])

    __table_args__ = (
        CheckConstraint(
            "status in ('Requested','Approved','Rejected')",
            name="ck_transfer_status",
        ),
    )

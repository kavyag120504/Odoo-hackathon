from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import MaintenancePriority, MaintenanceStatus


class MaintenanceRequest(Base):
    """5-state kanban workflow. Asset status flips on Approved, back on Resolved."""

    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    raised_by_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default=MaintenancePriority.MEDIUM.value
    )
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=MaintenanceStatus.PENDING.value
    )
    assigned_to_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    approved_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    asset = relationship("Asset", back_populates="maintenance_requests")
    raised_by = relationship("Employee", foreign_keys=[raised_by_id])
    assigned_to = relationship("Employee", foreign_keys=[assigned_to_id])
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])

    __table_args__ = (
        CheckConstraint(
            "priority in ('Low','Medium','High')",
            name="ck_maintenance_priority",
        ),
        CheckConstraint(
            "status in ('Pending','Approved','Technician Assigned','In Progress','Resolved','Rejected')",
            name="ck_maintenance_status",
        ),
    )

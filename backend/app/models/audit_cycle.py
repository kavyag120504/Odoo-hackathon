from datetime import datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import AuditCycleStatus


class AuditCycle(Base):
    """Audit cycle for department or location scope. Locks on close, Missing→Lost."""

    __tablename__ = "audit_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)  # Department or Location
    scope_value: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[str] = mapped_column(Date, nullable=False)
    end_date: Mapped[str] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AuditCycleStatus.OPEN.value
    )
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    auditors = relationship("AuditAuditor", back_populates="audit_cycle")
    items = relationship("AuditItem", back_populates="audit_cycle")

    __table_args__ = (
        CheckConstraint(
            "status in ('Open','Closed')", name="ck_audit_cycle_status"
        ),
        CheckConstraint(
            "scope_type in ('Department','Location')", name="ck_audit_scope_type"
        ),
    )

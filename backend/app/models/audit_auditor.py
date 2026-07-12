from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AuditAuditor(Base):
    """Junction table linking audit cycles to assigned auditors."""

    __tablename__ = "audit_auditors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    audit_cycle_id: Mapped[int] = mapped_column(
        ForeignKey("audit_cycles.id", ondelete="CASCADE"), nullable=False
    )
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )

    audit_cycle = relationship("AuditCycle", back_populates="auditors")
    employee = relationship("Employee", foreign_keys=[employee_id])

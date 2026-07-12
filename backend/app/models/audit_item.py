from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import VerificationStatus


class AuditItem(Base):
    """Individual asset verification within an audit cycle. Verified/Missing/Damaged."""

    __tablename__ = "audit_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    audit_cycle_id: Mapped[int] = mapped_column(
        ForeignKey("audit_cycles.id", ondelete="CASCADE"), nullable=False
    )
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False
    )
    expected_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=VerificationStatus.VERIFIED.value
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    audit_cycle = relationship("AuditCycle", back_populates="items")
    asset = relationship("Asset", back_populates="audit_items")

    __table_args__ = (
        CheckConstraint(
            "verification_status in ('Verified','Missing','Damaged')",
            name="ck_verification_status",
        ),
    )

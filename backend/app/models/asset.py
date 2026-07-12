from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import AssetStatus


class Asset(Base):
    """Core asset entity with all 7 lifecycle states. QR code is required and unique."""

    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("asset_categories.id", ondelete="RESTRICT"), nullable=False
    )
    # Auto-generated, unique, format AF-0001
    asset_tag: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Required field per spec — auto-generated UUID or similar
    qr_code: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    acquisition_date: Mapped[str | None] = mapped_column(Date, nullable=True)
    acquisition_cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    condition: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    documents_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_bookable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AssetStatus.AVAILABLE.value
    )

    category = relationship("AssetCategory", back_populates="assets")
    allocations = relationship("Allocation", back_populates="asset")
    transfer_requests = relationship("TransferRequest", back_populates="asset")
    bookings = relationship("Booking", back_populates="asset")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="asset")
    audit_items = relationship("AuditItem", back_populates="asset")

    __table_args__ = (
        CheckConstraint(
            "status in ('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')",
            name="ck_asset_status",
        ),
    )

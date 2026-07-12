from sqlalchemy import CheckConstraint, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import UserStatus


class AssetCategory(Base):
    """Asset categories with optional custom fields (e.g. warranty_months for Electronics)."""

    __tablename__ = "asset_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    # JSON field for custom attributes per category (e.g. {"warranty_months": 24})
    custom_fields: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserStatus.ACTIVE.value
    )

    assets = relationship("Asset", back_populates="category")

    __table_args__ = (
        CheckConstraint(
            "status in ('Active','Inactive')", name="ck_asset_category_status"
        ),
    )

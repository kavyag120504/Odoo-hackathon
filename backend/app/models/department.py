from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import UserStatus


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    # Optional self-referential parent. A dept may not be its own parent (guarded
    # in the org-setup logic Person C owns; FK keeps referential integrity here).
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    head_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserStatus.ACTIVE.value
    )

    parent = relationship("Department", remote_side=[id], foreign_keys=[parent_id])
    # Employees in this department. head_id is disambiguated explicitly.
    employees = relationship(
        "Employee",
        back_populates="department",
        foreign_keys="Employee.department_id",
    )

    __table_args__ = (
        CheckConstraint(
            "status in ('Active','Inactive')", name="ck_department_status"
        ),
    )

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Role, UserStatus

__all__ = ["Employee", "Role", "UserStatus"]


class Employee(Base):
    """Doubles as the auth user record. email is unique at the DB level (not just
    app validation), per spec. password_hash is a stdlib pbkdf2 hash (see
    app.core.security) so we carry no native-crypto build dependency."""

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=Role.EMPLOYEE.value
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserStatus.ACTIVE.value
    )

    department = relationship(
        "Department",
        back_populates="employees",
        foreign_keys=[department_id],
    )

    __table_args__ = (
        CheckConstraint(
            "role in ('Employee','Department Head','Asset Manager','Admin')",
            name="ck_employee_role",
        ),
        CheckConstraint(
            "status in ('Active','Inactive')", name="ck_employee_status"
        ),
    )

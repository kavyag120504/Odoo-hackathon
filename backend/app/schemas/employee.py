from pydantic import BaseModel, ConfigDict, field_validator

from app.models.employee import Role


class RoleUpdateIn(BaseModel):
    """Promote/demote an employee. Validated against the Role enum so a bogus
    role string is a clean 422, not a broken DB row."""

    role: str

    @field_validator("role")
    @classmethod
    def _valid_role(cls, v: str) -> str:
        allowed = {r.value for r in Role}
        if v not in allowed:
            raise ValueError(f"role must be one of {sorted(allowed)}")
        return v


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    department_id: int | None
    status: str

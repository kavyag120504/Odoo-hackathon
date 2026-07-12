"""Maintenance request schemas (Person D).

Priority and status are validated against the enum here so a bad value comes
back as a clean 422 at the boundary instead of tripping the DB check
constraint further down — same pattern as schemas/employee.py's RoleUpdateIn.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import MaintenancePriority, MaintenanceStatus


class MaintenanceCreate(BaseModel):
    asset_id: int
    description: str
    priority: str = MaintenancePriority.MEDIUM.value
    photo_url: str | None = None

    @field_validator("description")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description is required")
        return v

    @field_validator("priority")
    @classmethod
    def _valid_priority(cls, v: str) -> str:
        allowed = {p.value for p in MaintenancePriority}
        if v not in allowed:
            raise ValueError(f"priority must be one of {sorted(allowed)}")
        return v


class MaintenanceStatusUpdate(BaseModel):
    """Single-step move to the next kanban column. assigned_to_id is only
    read (and required) when the move lands on Technician Assigned."""

    status: str
    assigned_to_id: int | None = None

    @field_validator("status")
    @classmethod
    def _valid_status(cls, v: str) -> str:
        allowed = {s.value for s in MaintenanceStatus}
        if v not in allowed:
            raise ValueError(f"status must be one of {sorted(allowed)}")
        return v


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    asset_name: str
    asset_tag: str
    raised_by_id: int | None
    raised_by_name: str | None
    description: str
    priority: str
    photo_url: str | None
    status: str
    assigned_to_id: int | None
    assigned_to_name: str | None
    approved_by_id: int | None
    resolved_at: datetime | None
    created_at: datetime


class MaintenanceAssetOut(BaseModel):
    """Minimal asset picker for the raise-request form. Scoped to this router
    so the Maintenance screen doesn't block on Person C's Asset Registry API —
    it only needs enough to populate a dropdown and grey out unavailable ones."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_tag: str
    status: str

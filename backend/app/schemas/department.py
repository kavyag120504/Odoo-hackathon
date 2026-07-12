from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    parent_id: int | None = None
    head_id: int | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    parent_id: int | None = None
    head_id: int | None = None
    status: str | None = None


class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    parent_id: int | None
    head_id: int | None
    status: str

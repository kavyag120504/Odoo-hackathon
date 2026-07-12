from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    # Frontend sends a JSON string (e.g. '{"warranty_months":24}'); stored as-is.
    custom_fields: str | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    custom_fields: str | None
    status: str

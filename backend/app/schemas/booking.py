from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class BookingCreate(BaseModel):
    asset_id: int
    start_time: datetime
    end_time: datetime
    purpose: str | None = None

    @model_validator(mode="after")
    def _check_order(self):
        if self.start_time >= self.end_time:
            raise ValueError("end_time must be after start_time")
        return self


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    booked_by_id: int | None
    start_time: datetime
    end_time: datetime
    status: str
    purpose: str | None
    created_at: datetime | None = None

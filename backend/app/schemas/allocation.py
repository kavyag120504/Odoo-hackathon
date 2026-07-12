from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AllocationBase(BaseModel):
    asset_id: int
    employee_id: Optional[int] = None
    department_id: Optional[int] = None
    expected_return_date: Optional[datetime] = None

class AllocationCreate(AllocationBase):
    pass

class AllocationResponse(AllocationBase):
    id: int
    allocated_at: datetime
    actual_return_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

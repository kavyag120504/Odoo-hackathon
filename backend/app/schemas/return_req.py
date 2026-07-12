from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ReturnRequestCreate(BaseModel):
    allocation_id: int
    requested_by_id: int
    employee_notes: Optional[str] = None

class ReturnApprove(BaseModel):
    approved_by_id: int
    manager_notes: Optional[str] = None

class ReturnRequestResponse(BaseModel):
    id: int
    allocation_id: int
    requested_by_id: Optional[int]
    employee_notes: Optional[str]
    manager_notes: Optional[str]
    status: str
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

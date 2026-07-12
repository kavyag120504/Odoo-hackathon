from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TransferRequestCreate(BaseModel):
    asset_id: int
    from_employee_id: int
    to_employee_id: int
    reason: Optional[str] = None

class TransferApprove(BaseModel):
    approved_by_id: int

class TransferRequestResponse(BaseModel):
    id: int
    asset_id: int
    from_employee_id: Optional[int]
    to_employee_id: Optional[int]
    reason: Optional[str]
    status: str
    approved_by_id: Optional[int]
    approved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

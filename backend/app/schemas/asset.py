from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class AssetCreate(BaseModel):
    name: str
    category_id: int
    serial_number: Optional[str] = None
    acquisition_date: Optional[date] = None
    acquisition_cost: Optional[float] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    is_bookable: bool = False


class AssetResponse(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    asset_tag: Optional[str] = None
    serial_number: Optional[str] = None
    qr_code: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    is_bookable: bool
    status: str
    
    # Extra fields for UI convenience
    current_holder_name: Optional[str] = None
    current_department_name: Optional[str] = None

    class Config:
        from_attributes = True

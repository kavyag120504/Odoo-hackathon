from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AssetResponse(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    asset_tag: Optional[str] = None
    serial_number: Optional[str] = None
    qr_code: Optional[str] = None
    condition: str
    location: Optional[str] = None
    is_bookable: bool
    status: str
    
    # Extra fields for UI convenience
    current_holder_name: Optional[str] = None
    current_department_name: Optional[str] = None

    class Config:
        from_attributes = True

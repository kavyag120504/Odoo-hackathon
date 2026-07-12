from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.maintenance_log import MaintenanceLog
from app.models.employee import Employee
from app.models.department import Department
from app.models.enums import AllocationStatus
from app.schemas.asset import AssetResponse

router = APIRouter(prefix="/api/assets", tags=["Assets"])

@router.get("", response_model=List[AssetResponse])
def get_assets(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Search by tag, serial, or QR code"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status: Optional[str] = Query(None, description="Filter by exact asset status"),
    department_id: Optional[int] = Query(None, description="Filter by current department (via allocation)")
):
    # Base query joining active allocation, employee, and department
    query = db.query(Asset, Allocation, Employee, Department)\
        .outerjoin(Allocation, (Allocation.asset_id == Asset.id) & (Allocation.status == AllocationStatus.ACTIVE.value))\
        .outerjoin(Employee, Employee.id == Allocation.employee_id)\
        .outerjoin(Department, Department.id == Employee.department_id)

    # Apply filters
    if category_id:
        query = query.filter(Asset.category_id == category_id)
        
    if status:
        query = query.filter(Asset.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Asset.asset_tag.ilike(search_term),
                Asset.serial_number.ilike(search_term),
                Asset.qr_code.ilike(search_term)
            )
        )

    if department_id:
        # Asset is in the department if:
        # 1. It is allocated to an employee who belongs to the department
        # 2. Or it is allocated directly to the department
        query = query.filter(
            or_(
                Department.id == department_id,
                Allocation.department_id == department_id
            )
        )

    results = query.all()

    # Format the response with the computed convenience fields
    response_list = []
    for asset, allocation, employee, employee_dept in results:
        holder_name = None
        dept_name = None
        
        if allocation:
            if employee:
                holder_name = employee.name
                if employee_dept:
                    dept_name = employee_dept.name
            elif allocation.department_id:
                # If allocated directly to department, fetch that department
                direct_dept = db.query(Department).filter(Department.id == allocation.department_id).first()
                if direct_dept:
                    holder_name = direct_dept.name
                    dept_name = direct_dept.name
                    
        # Create a dict from the asset model to pass to the Pydantic schema
        asset_dict = {
            "id": asset.id,
            "name": asset.name,
            "category_id": asset.category_id,
            "asset_tag": asset.asset_tag,
            "serial_number": asset.serial_number,
            "qr_code": asset.qr_code,
            "condition": asset.condition,
            "location": asset.location,
            "is_bookable": asset.is_bookable,
            "status": asset.status,
            "current_holder_name": holder_name,
            "current_department_name": dept_name
        }
        response_list.append(asset_dict)

    return response_list

@router.get("/{asset_id}/history")
def get_asset_history(asset_id: int, db: Session = Depends(get_db)):
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Fetch Allocations
    allocations = db.query(Allocation).filter(Allocation.asset_id == asset_id).all()
    
    # Fetch Maintenance Logs
    maintenance_logs = db.query(MaintenanceLog).filter(MaintenanceLog.asset_id == asset_id).all()

    # We need a unified feed, so we will combine them into a list of dicts and sort by date
    history = []

    for alloc in allocations:
        holder = "Unknown"
        if alloc.employee_id:
            emp = db.query(Employee).filter(Employee.id == alloc.employee_id).first()
            if emp: holder = emp.name
        elif alloc.department_id:
            dept = db.query(Department).filter(Department.id == alloc.department_id).first()
            if dept: holder = dept.name
            
        history.append({
            "type": "ALLOCATION",
            "date": alloc.allocated_at,
            "details": f"Allocated to {holder}",
            "status": alloc.status
        })
        
        if alloc.actual_return_date:
            history.append({
                "type": "RETURN",
                "date": alloc.actual_return_date,
                "details": f"Returned by {holder}",
                "status": "Completed"
            })

    for log in maintenance_logs:
        history.append({
            "type": "MAINTENANCE",
            "date": log.maintenance_date,
            "details": log.description,
            "status": log.status
        })

    # Sort chronological (newest first)
    history.sort(key=lambda x: x["date"], reverse=True)

    return history

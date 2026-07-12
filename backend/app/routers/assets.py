from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.maintenance_request import MaintenanceRequest
from app.models.employee import Employee
from app.models.department import Department

router = APIRouter(prefix="/api/assets", tags=["Assets"])

@router.get("/{asset_id}/history")
def get_asset_history(asset_id: int, db: Session = Depends(get_db)):
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Fetch Allocations
    allocations = db.query(Allocation).filter(Allocation.asset_id == asset_id).all()
    
    # Fetch Maintenance Logs
    maintenance_logs = db.query(MaintenanceRequest).filter(MaintenanceRequest.asset_id == asset_id).all()

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
            "date": log.created_at,
            "details": log.description,
            "status": log.status
        })

    # Sort chronological (newest first)
    history.sort(key=lambda x: x["date"], reverse=True)

    return history

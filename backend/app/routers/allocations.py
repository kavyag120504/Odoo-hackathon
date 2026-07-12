from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.employee import Employee
from app.models.department import Department
from app.models.enums import AssetStatus, AllocationStatus
from app.schemas.allocation import AllocationCreate, AllocationResponse

router = APIRouter(prefix="/api/allocations", tags=["Allocations"])

@router.post("", response_model=AllocationResponse, status_code=status.HTTP_201_CREATED)
def allocate_asset(allocation_in: AllocationCreate, db: Session = Depends(get_db)):
    # 1. Validation: Must have either employee_id or department_id
    if not allocation_in.employee_id and not allocation_in.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify either employee_id or department_id for allocation."
        )

    # 2. Fetch the asset
    asset = db.query(Asset).filter(Asset.id == allocation_in.asset_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with ID {allocation_in.asset_id} not found."
        )

    # 3. Conflict Check (Edge case #1): Is it already allocated?
    if asset.status == AssetStatus.ALLOCATED.value:
        # Find who holds it currently
        active_allocation = db.query(Allocation).filter(
            Allocation.asset_id == asset.id,
            Allocation.status == AllocationStatus.ACTIVE.value
        ).first()
        
        holder_name = "Unknown"
        if active_allocation:
            if active_allocation.employee_id:
                emp = db.query(Employee).filter(Employee.id == active_allocation.employee_id).first()
                if emp: holder_name = emp.name
            elif active_allocation.department_id:
                dept = db.query(Department).filter(Department.id == active_allocation.department_id).first()
                if dept: holder_name = dept.name
                
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset is currently held by {holder_name}."
        )

    # 4. Conflict Check (Edge case #2): Is it in a state that cannot be allocated?
    if asset.status != AssetStatus.AVAILABLE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot allocate asset. Current status is '{asset.status}'."
        )

    # 5. Write allocation row
    new_allocation = Allocation(
        asset_id=asset.id,
        employee_id=allocation_in.employee_id,
        department_id=allocation_in.department_id,
        expected_return_date=allocation_in.expected_return_date,
        status=AllocationStatus.ACTIVE.value,
        allocated_at=datetime.utcnow()
    )
    db.add(new_allocation)

    # 6. Set asset status to Allocated
    asset.status = AssetStatus.ALLOCATED.value

    # Commit transaction
    db.commit()
    db.refresh(new_allocation)

    return new_allocation

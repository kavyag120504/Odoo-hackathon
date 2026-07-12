from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.employee import Employee
from app.models.return_request import ReturnRequest
from app.models.enums import AssetStatus, AllocationStatus, ReturnStatus, Role
from app.schemas.return_req import ReturnRequestCreate, ReturnRequestResponse, ReturnApprove

router = APIRouter(prefix="/returns", tags=["Returns"])

@router.post("", response_model=ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
def initiate_return(return_in: ReturnRequestCreate, db: Session = Depends(get_db)):
    # 1. Verify allocation
    allocation = db.query(Allocation).filter(Allocation.id == return_in.allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found.")
    
    if allocation.status != AllocationStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Only active allocations can be returned.")
        
    # Edge case: Asset never allocated -> handled by the check above, but we can be explicit
    # Wait, the prompt says "Returning an asset never allocated -> clean error, not a crash."
    # Passing an invalid allocation_id returns 404. What if they pass an asset_id instead of allocation_id?
    # The schema takes allocation_id, so it's safe.

    # 2. Check if return request already exists
    existing_return = db.query(ReturnRequest).filter(
        ReturnRequest.allocation_id == allocation.id,
        ReturnRequest.status == ReturnStatus.REQUESTED.value
    ).first()
    if existing_return:
        raise HTTPException(status_code=400, detail="A return request is already pending for this allocation.")

    # 3. Create return request
    new_return = ReturnRequest(
        allocation_id=allocation.id,
        requested_by_id=return_in.requested_by_id,
        employee_notes=return_in.employee_notes,
        status=ReturnStatus.REQUESTED.value
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)

    return new_return


@router.patch("/{return_id}/approve", response_model=ReturnRequestResponse)
def approve_return(return_id: int, approve_in: ReturnApprove, db: Session = Depends(get_db)):
    # 1. Fetch return request
    return_req = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found.")
    
    if return_req.status != ReturnStatus.REQUESTED.value:
        raise HTTPException(status_code=400, detail="Return request is not in a pending state.")

    # 2. Check permissions (Asset Manager only per spec)
    approver = db.query(Employee).filter(Employee.id == approve_in.approved_by_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="Approver not found.")
    
    # "Employee attempts to self-finalize a return without Asset Manager approval -> blocked, stays pending"
    if approver.role != Role.ASSET_MANAGER.value and approver.role != Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Only Asset Managers can approve returns.")

    # 3. Approve logic
    now = datetime.utcnow()
    
    # Close allocation
    allocation = db.query(Allocation).filter(Allocation.id == return_req.allocation_id).first()
    if allocation:
        allocation.status = AllocationStatus.RETURNED.value
        allocation.actual_return_date = now

        # Update Asset status back to Available
        asset = db.query(Asset).filter(Asset.id == allocation.asset_id).first()
        if asset:
            asset.status = AssetStatus.AVAILABLE.value

    # Update return request
    return_req.status = ReturnStatus.APPROVED.value
    return_req.manager_notes = approve_in.manager_notes
    return_req.approved_by_id = approver.id
    return_req.approved_at = now

    db.commit()
    db.refresh(return_req)

    return return_req

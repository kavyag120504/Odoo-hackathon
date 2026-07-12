from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.employee import Employee
from app.models.transfer_request import TransferRequest
from app.models.enums import AssetStatus, AllocationStatus, TransferStatus, Role
from app.schemas.transfer import TransferRequestCreate, TransferRequestResponse, TransferApprove

router = APIRouter(prefix="/api/transfers", tags=["Transfers"])

@router.post("", response_model=TransferRequestResponse, status_code=status.HTTP_201_CREATED)
def create_transfer_request(transfer_in: TransferRequestCreate, db: Session = Depends(get_db)):
    # 1. Verify the asset exists and is currently allocated
    asset = db.query(Asset).filter(Asset.id == transfer_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found.")
    if asset.status != AssetStatus.ALLOCATED.value:
        raise HTTPException(status_code=400, detail="Only allocated assets can be transferred.")

    # 2. Verify current allocation matches the from_employee
    active_allocation = db.query(Allocation).filter(
        Allocation.asset_id == asset.id,
        Allocation.status == AllocationStatus.ACTIVE.value
    ).first()
    
    if not active_allocation or active_allocation.employee_id != transfer_in.from_employee_id:
        raise HTTPException(status_code=400, detail="Asset is not currently allocated to the specified from_employee.")

    # 3. Create transfer request
    new_request = TransferRequest(
        asset_id=asset.id,
        from_employee_id=transfer_in.from_employee_id,
        to_employee_id=transfer_in.to_employee_id,
        reason=transfer_in.reason,
        status=TransferStatus.REQUESTED.value
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return new_request

@router.patch("/{transfer_id}/approve", response_model=TransferRequestResponse)
def approve_transfer(transfer_id: int, approve_in: TransferApprove, db: Session = Depends(get_db)):
    # 1. Fetch the request
    transfer = db.query(TransferRequest).filter(TransferRequest.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer request not found.")
    
    if transfer.status != TransferStatus.REQUESTED.value:
        raise HTTPException(status_code=400, detail=f"Cannot approve transfer with status '{transfer.status}'.")

    # 2. Check permissions (Asset Manager or Dept Head of the current holder)
    approver = db.query(Employee).filter(Employee.id == approve_in.approved_by_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="Approver not found.")
    
    from_emp = db.query(Employee).filter(Employee.id == transfer.from_employee_id).first()
    
    if approver.role == Role.EMPLOYEE.value:
        raise HTTPException(status_code=403, detail="Employees cannot approve transfers.")
    
    if approver.role == Role.DEPARTMENT_HEAD.value and from_emp.department_id != approver.department_id:
        raise HTTPException(status_code=403, detail="Department Heads can only approve transfers for their own department.")

    # 3. Approve logic: Close old allocation, create new allocation
    active_allocation = db.query(Allocation).filter(
        Allocation.asset_id == transfer.asset_id,
        Allocation.status == AllocationStatus.ACTIVE.value
    ).first()

    now = datetime.utcnow()
    
    if active_allocation:
        active_allocation.status = AllocationStatus.RETURNED.value
        active_allocation.actual_return_date = now

    # Open new allocation
    new_allocation = Allocation(
        asset_id=transfer.asset_id,
        employee_id=transfer.to_employee_id,
        status=AllocationStatus.ACTIVE.value,
        allocated_at=now
    )
    db.add(new_allocation)

    # Update transfer status
    transfer.status = TransferStatus.APPROVED.value
    transfer.approved_by_id = approver.id
    transfer.approved_at = now

    db.commit()
    db.refresh(transfer)

    return transfer

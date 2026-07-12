"""Departments CRUD (Org Setup — Departments tab).

Was missing entirely, so OrgSetup's Departments tab + the global AppDataContext
fetch 404'd. Includes the spec's two edge cases:
  - deactivating a department with active employees -> blocked with a count
  - a department cannot be its own parent
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.department import Department
from app.models.employee import Employee, Role
from app.models.enums import UserStatus
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=list[DepartmentOut])
def list_departments(
    _: Employee = Depends(get_current_user), db: Session = Depends(get_db)
):
    return db.query(Department).order_by(Department.id).all()


@router.post(
    "",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(Role.ADMIN))],
)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(
        name=payload.name,
        parent_id=payload.parent_id,
        head_id=payload.head_id,
        status=UserStatus.ACTIVE.value,
    )
    db.add(dept)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A department with this name already exists.")
    db.refresh(dept)
    return dept


@router.patch(
    "/{department_id}",
    response_model=DepartmentOut,
    dependencies=[Depends(require_role(Role.ADMIN))],
)
def update_department(
    department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)
):
    dept = db.get(Department, department_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="Department not found.")

    if payload.parent_id == department_id:
        raise HTTPException(status_code=400, detail="A department cannot be its own parent.")

    # Deactivation guard: never silently orphan active employees.
    if payload.status == UserStatus.INACTIVE.value:
        active = (
            db.query(Employee)
            .filter(Employee.department_id == department_id)
            .filter(Employee.status == UserStatus.ACTIVE.value)
            .count()
        )
        if active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot deactivate — {active} active employee(s) still assigned. Reassign them first.",
            )

    for field in ("name", "parent_id", "head_id", "status"):
        val = getattr(payload, field)
        if val is not None:
            setattr(dept, field, val)
    db.commit()
    db.refresh(dept)
    return dept

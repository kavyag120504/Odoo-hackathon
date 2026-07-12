"""Employee directory + role management.

Demonstrates the reusable role-gate: listing is open to any authenticated user
(the sidebar/directory needs it), but promoting a role is Admin-only — the
canonical "Admin-only route hit as Employee -> 403" the spec calls out. The
promote action backs the demo's opening beat (Admin promotes signup -> Asset
Manager). The Employee Directory UI (Person C) calls these endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.employee import Employee, Role
from app.schemas.employee import EmployeeOut, RoleUpdateIn

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    _: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Employee).order_by(Employee.id).all()


@router.patch(
    "/{employee_id}/role",
    response_model=EmployeeOut,
    dependencies=[Depends(require_role(Role.ADMIN))],
)
def set_employee_role(
    employee_id: int,
    payload: RoleUpdateIn,
    db: Session = Depends(get_db),
):
    employee = db.get(Employee, employee_id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found."
        )
    employee.role = payload.role
    db.commit()
    db.refresh(employee)
    return employee

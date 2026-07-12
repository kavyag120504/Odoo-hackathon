"""Reusable role-gate + dept-scoped guard (Person B, team lead).

This is THE authorization layer the whole team applies. Two primitives:

  require_role(*roles)              -> FastAPI dependency; 403 if user lacks role
  ensure_department_scope(user, id) -> raise 403 unless user may act on that dept

Usage in any router (A/C/D reuse verbatim):

    from app.core.rbac import require_role, ensure_department_scope
    from app.models.employee import Role

    @router.post("/assets", dependencies=[Depends(require_role(Role.ASSET_MANAGER, Role.ADMIN))])
    def create_asset(...): ...

    # dept-scoped approval (Dept Head A cannot touch Dept B):
    def approve_transfer(t, user = Depends(get_current_user)):
        ensure_department_scope(user, t.department_id)
        ...
"""

from fastapi import Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models.employee import Employee, Role

# Roles that can act across ALL departments (not scoped to their own).
_CROSS_DEPARTMENT_ROLES = {Role.ADMIN.value, Role.ASSET_MANAGER.value}


def require_role(*roles: Role):
    """Dependency factory. Returns a dependency that 403s unless the current
    user holds one of `roles`. Admin is always allowed (superset)."""

    allowed = {r.value for r in roles} | {Role.ADMIN.value}

    def _guard(user: Employee = Depends(get_current_user)) -> Employee:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return user

    return _guard


def can_act_on_department(user: Employee, department_id: int | None) -> bool:
    """Admin/Asset Manager may act on any department. A Department Head may act
    only on their own. Everyone else: no."""
    if user.role in _CROSS_DEPARTMENT_ROLES:
        return True
    if user.role == Role.DEPARTMENT_HEAD.value:
        return department_id is not None and user.department_id == department_id
    return False


def ensure_department_scope(user: Employee, department_id: int | None) -> None:
    """Raise 403 unless `user` may act on `department_id`. Use inside handlers
    for approvals scoped to a department (transfers, dept bookings, etc.)."""
    if not can_act_on_department(user, department_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only act within your own department.",
        )

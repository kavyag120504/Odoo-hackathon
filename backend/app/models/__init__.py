"""Shared model layer.

Person B (team lead) owns the foundation: Base, Department, Employee + the Role
enum used by RBAC everywhere. Person A extends this package with the remaining
spec tables (asset_categories, assets, allocations, transfer_requests,
return_requests, bookings, maintenance_requests, audit_*, notifications,
activity_log). Import new models here so `Base.metadata.create_all` sees them.
"""

from app.models.department import Department
from app.models.employee import Employee, Role, UserStatus

__all__ = ["Department", "Employee", "Role", "UserStatus"]

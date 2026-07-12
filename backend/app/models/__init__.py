"""Shared model layer.

Person B (team lead) owns the foundation: Base, Department, Employee + the Role
enum used by RBAC everywhere. Person A extends this package with the remaining
spec tables (asset_categories, assets, allocations, transfer_requests,
return_requests, bookings, maintenance_requests, audit_*, notifications,
activity_log). Import new models here so `Base.metadata.create_all` sees them.
"""

from app.models.activity_log import ActivityLog
from app.models.allocation import Allocation
from app.models.asset import Asset
from app.models.asset_category import AssetCategory
from app.models.audit_auditor import AuditAuditor
from app.models.audit_cycle import AuditCycle
from app.models.audit_item import AuditItem
from app.models.booking import Booking
from app.models.department import Department
from app.models.employee import Employee, Role, UserStatus
from app.models.maintenance_request import MaintenanceRequest
from app.models.notification import Notification
from app.models.return_request import ReturnRequest
from app.models.transfer_request import TransferRequest

__all__ = [
    "ActivityLog",
    "Allocation",
    "Asset",
    "AssetCategory",
    "AuditAuditor",
    "AuditCycle",
    "AuditItem",
    "Booking",
    "Department",
    "Employee",
    "MaintenanceRequest",
    "Notification",
    "ReturnRequest",
    "Role",
    "TransferRequest",
    "UserStatus",
]

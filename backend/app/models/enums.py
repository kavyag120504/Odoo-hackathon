import enum


class Role(str, enum.Enum):
    """Application roles. Signup can only ever produce EMPLOYEE; every elevated
    role is assigned later via the Employee Directory promote action."""

    EMPLOYEE = "Employee"
    DEPARTMENT_HEAD = "Department Head"
    ASSET_MANAGER = "Asset Manager"
    ADMIN = "Admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class AssetStatus(str, enum.Enum):
    """7 lifecycle states per spec. Reserved is computed from active bookings."""

    AVAILABLE = "Available"
    ALLOCATED = "Allocated"
    RESERVED = "Reserved"
    UNDER_MAINTENANCE = "Under Maintenance"
    LOST = "Lost"
    RETIRED = "Retired"
    DISPOSED = "Disposed"


# (Person B / Booking) Statuses that block a new booking regardless of slot.
BLOCKED_FOR_BOOKING = {
    AssetStatus.UNDER_MAINTENANCE.value,
    AssetStatus.LOST.value,
    AssetStatus.RETIRED.value,
    AssetStatus.DISPOSED.value,
}


class AllocationStatus(str, enum.Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"


class TransferStatus(str, enum.Enum):
    REQUESTED = "Requested"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class ReturnStatus(str, enum.Enum):
    REQUESTED = "Requested"
    APPROVED = "Approved"


class BookingStatus(str, enum.Enum):
    UPCOMING = "Upcoming"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


# (Person B / Booking) Bookings in these states hold a slot (block overlaps).
# Completed/Cancelled free the slot so it's immediately re-bookable.
ACTIVE_BOOKING_STATUSES = {BookingStatus.UPCOMING.value, BookingStatus.ONGOING.value}


class MaintenancePriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class MaintenanceStatus(str, enum.Enum):
    """5-state kanban per mockup Screen 7."""

    PENDING = "Pending"
    APPROVED = "Approved"
    TECHNICIAN_ASSIGNED = "Technician Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"


class AuditCycleStatus(str, enum.Enum):
    OPEN = "Open"
    CLOSED = "Closed"


class VerificationStatus(str, enum.Enum):
    VERIFIED = "Verified"
    MISSING = "Missing"
    DAMAGED = "Damaged"


class NotificationCategory(str, enum.Enum):
    """Mockup Screen 10 filter tabs: All / Alerts / Approvals / Bookings."""

    ALERT = "Alert"
    APPROVAL = "Approval"
    BOOKING = "Booking"

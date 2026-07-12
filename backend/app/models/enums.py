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

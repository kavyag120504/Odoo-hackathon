import sys
import os
from datetime import datetime, timedelta
import random

# Add the parent directory to sys.path so we can import the app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models.department import Department
from app.models.employee import Employee
from app.models.asset_category import AssetCategory
from app.models.asset import Asset
from app.models.allocation import Allocation
from app.models.booking import Booking
from app.models.enums import Role, UserStatus, AssetStatus, AllocationStatus, BookingStatus

def seed_data():
    db = SessionLocal()
    
    try:
        # 1. Create Departments
        it_dept = Department(name="IT Department")
        hr_dept = Department(name="HR Department")
        db.add_all([it_dept, hr_dept])
        db.commit()
        db.refresh(it_dept)
        db.refresh(hr_dept)

        # 2. Create Employees
        users = [
            Employee(name="Alice Admin", email="admin@test.com", password_hash="hashed_pw", role=Role.ADMIN, department_id=it_dept.id),
            Employee(name="Bob Manager", email="manager@test.com", password_hash="hashed_pw", role=Role.ASSET_MANAGER, department_id=it_dept.id),
            Employee(name="Charlie IT Head", email="ithead@test.com", password_hash="hashed_pw", role=Role.DEPARTMENT_HEAD, department_id=it_dept.id),
            Employee(name="Diana HR Head", email="hrhead@test.com", password_hash="hashed_pw", role=Role.DEPARTMENT_HEAD, department_id=hr_dept.id),
            Employee(name="Eve Employee", email="eve@test.com", password_hash="hashed_pw", role=Role.EMPLOYEE, department_id=it_dept.id),
            Employee(name="Frank Employee", email="frank@test.com", password_hash="hashed_pw", role=Role.EMPLOYEE, department_id=hr_dept.id),
            Employee(name="Grace Employee", email="grace@test.com", password_hash="hashed_pw", role=Role.EMPLOYEE, department_id=hr_dept.id),
        ]
        db.add_all(users)
        db.commit()
        
        # Set department heads
        it_dept.head_id = users[2].id
        hr_dept.head_id = users[3].id
        db.commit()

        # 3. Create Asset Categories
        cat_laptops = AssetCategory(name="Laptops", custom_fields='{"warranty_months": 36}')
        cat_peripherals = AssetCategory(name="Peripherals", custom_fields='{}')
        cat_furniture = AssetCategory(name="Furniture", custom_fields='{}')
        db.add_all([cat_laptops, cat_peripherals, cat_furniture])
        db.commit()
        db.refresh(cat_laptops)
        db.refresh(cat_peripherals)

        # 4. Create Assets in all 7 states
        now = datetime.utcnow()
        assets = [
            # 1. Available
            Asset(name="MacBook Pro M2", category_id=cat_laptops.id, asset_tag="AF-1001", qr_code="QR-1001", status=AssetStatus.AVAILABLE.value, is_bookable=True),
            # 2. Allocated (Normal)
            Asset(name="Dell XPS 15", category_id=cat_laptops.id, asset_tag="AF-1002", qr_code="QR-1002", status=AssetStatus.ALLOCATED.value, is_bookable=False),
            # 3. Allocated (Overdue)
            Asset(name="Lenovo ThinkPad", category_id=cat_laptops.id, asset_tag="AF-1003", qr_code="QR-1003", status=AssetStatus.ALLOCATED.value, is_bookable=False),
            # 4. Reserved (Upcoming/Ongoing Booking)
            Asset(name="Conference Projector", category_id=cat_peripherals.id, asset_tag="AF-1004", qr_code="QR-1004", status=AssetStatus.RESERVED.value, is_bookable=True),
            # 5. Under Maintenance
            Asset(name="Standing Desk", category_id=cat_furniture.id, asset_tag="AF-1005", qr_code="QR-1005", status=AssetStatus.UNDER_MAINTENANCE.value, is_bookable=False),
            # 6. Lost
            Asset(name="Wireless Mouse", category_id=cat_peripherals.id, asset_tag="AF-1006", qr_code="QR-1006", status=AssetStatus.LOST.value, is_bookable=False),
            # 7. Retired
            Asset(name="Old Intel iMac", category_id=cat_laptops.id, asset_tag="AF-1007", qr_code="QR-1007", status=AssetStatus.RETIRED.value, is_bookable=False),
            # 8. Disposed
            Asset(name="Broken Chair", category_id=cat_furniture.id, asset_tag="AF-1008", qr_code="QR-1008", status=AssetStatus.DISPOSED.value, is_bookable=False),
            # 9. Extra bookable asset for overdue booking
            Asset(name="iPad Pro", category_id=cat_laptops.id, asset_tag="AF-1009", qr_code="QR-1009", status=AssetStatus.RESERVED.value, is_bookable=True),
        ]
        db.add_all(assets)
        db.commit()
        for a in assets: db.refresh(a)

        # 5. Create Allocations (Normal and Overdue)
        allocations = [
            # Normal active allocation
            Allocation(asset_id=assets[1].id, employee_id=users[4].id, allocated_at=now - timedelta(days=5), expected_return_date=now + timedelta(days=10), status=AllocationStatus.ACTIVE.value),
            # Overdue allocation
            Allocation(asset_id=assets[2].id, employee_id=users[5].id, allocated_at=now - timedelta(days=30), expected_return_date=now - timedelta(days=5), status=AllocationStatus.ACTIVE.value)
        ]
        db.add_all(allocations)
        db.commit()

        # 6. Create Bookings (Normal and Overdue)
        bookings = [
            # Active ongoing booking
            Booking(asset_id=assets[3].id, booked_by_id=users[6].id, start_time=now - timedelta(hours=1), end_time=now + timedelta(hours=2), purpose="Client Meeting", status=BookingStatus.ONGOING.value),
            # Overdue booking (was supposed to end yesterday but status wasn't completed)
            Booking(asset_id=assets[8].id, booked_by_id=users[4].id, start_time=now - timedelta(days=2), end_time=now - timedelta(days=1), purpose="Field testing", status=BookingStatus.ONGOING.value)
        ]
        db.add_all(bookings)
        db.commit()

        print("Seed data created successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

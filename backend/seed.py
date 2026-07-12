"""Minimal auth/RBAC seed (Person B scope).

Creates 2 departments and one demo account per role so login + the role-gate +
dept-scoped checks are demoable immediately. Person A's fuller seed (assets, all
7 lifecycle states, overdue allocation/booking) layers on top of this.

Run:  python seed.py
"""

from app.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.department import Department
from app.models.employee import Employee, Role, UserStatus

DEMO_PASSWORD = "password123"


def _get_or_create_department(db, name):
    dept = db.query(Department).filter(Department.name == name).first()
    if dept is None:
        dept = Department(name=name)
        db.add(dept)
        db.flush()
    return dept


def run():
    """Idempotent — safe to run any number of times, in ANY order relative to
    seed_data.py. It always ensures the working @assetflow.dev demo logins exist
    (creating them if missing, resetting the password if present), so login
    never breaks because another seed ran first."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        eng = _get_or_create_department(db, "Engineering")
        ops = _get_or_create_department(db, "Operations")

        people = [
            ("Admin User", "admin@assetflow.dev", Role.ADMIN, eng),
            ("Asset Manager", "manager@assetflow.dev", Role.ASSET_MANAGER, eng),
            ("Dept Head A (Eng)", "heada@assetflow.dev", Role.DEPARTMENT_HEAD, eng),
            ("Dept Head B (Ops)", "headb@assetflow.dev", Role.DEPARTMENT_HEAD, ops),
            ("Employee One", "emp1@assetflow.dev", Role.EMPLOYEE, eng),
            ("Employee Two", "emp2@assetflow.dev", Role.EMPLOYEE, ops),
        ]
        by_email = {}
        for name, email, role, dept in people:
            e = db.query(Employee).filter(Employee.email == email).first()
            if e is None:
                e = Employee(name=name, email=email, department_id=dept.id)
                db.add(e)
            # Always (re)set password + role so login is guaranteed to work.
            e.password_hash = hash_password(DEMO_PASSWORD)
            e.role = role.value
            e.status = UserStatus.ACTIVE.value
            db.flush()
            by_email[email] = e

        # Wire department heads (idempotent).
        eng.head_id = by_email["heada@assetflow.dev"].id
        ops.head_id = by_email["headb@assetflow.dev"].id

        db.commit()
        print(f"Ensured {len(people)} demo logins across 2 departments.")
        print(f"All demo passwords: {DEMO_PASSWORD!r}")

        _seed_bookable_assets(db)
    finally:
        db.close()


def _seed_bookable_assets(db):
    """A few resources so Booking (Person B) is demoable with WORKING logins.
    Matches Person A's Asset schema: category_id (required) + qr_code (required,
    unique). Idempotent + collision-safe via the BR-* tag range (won't clash
    with A's AF-0001 sequence)."""
    from app.models.asset import Asset
    from app.models.asset_category import AssetCategory
    from app.models.enums import AssetStatus

    # A's Asset.category_id is NOT NULL (FK RESTRICT) — ensure a category exists.
    category = (
        db.query(AssetCategory).filter(AssetCategory.name == "Bookable Resources").first()
    )
    if category is None:
        category = AssetCategory(name="Bookable Resources", custom_fields="{}")
        db.add(category)
        db.flush()

    # (name, asset_tag, qr_code, status, is_bookable)
    demo = [
        ("Conference Room A", "BR-001", "QR-BR-001", AssetStatus.AVAILABLE, True),
        ("Projector Epson X", "BR-002", "QR-BR-002", AssetStatus.AVAILABLE, True),
        ("Company Van", "BR-003", "QR-BR-003", AssetStatus.AVAILABLE, True),
        # Bookable but Under Maintenance -> booking must be blocked by status.
        ("DSLR Camera", "BR-004", "QR-BR-004", AssetStatus.UNDER_MAINTENANCE, True),
        # Available but NOT bookable -> booking must be blocked by is_bookable.
        ("Staff Laptop", "BR-005", "QR-BR-005", AssetStatus.AVAILABLE, False),
    ]
    existing = {a.asset_tag for a in db.query(Asset).all()}
    added = 0
    for name, tag, qr, st, bookable in demo:
        if tag in existing:
            continue
        db.add(
            Asset(
                name=name,
                asset_tag=tag,
                qr_code=qr,
                category_id=category.id,
                status=st.value,
                is_bookable=bookable,
            )
        )
        added += 1
    db.commit()
    if added:
        print(f"Seeded {added} demo assets (3 bookable, 1 under-maintenance, 1 non-bookable).")


if __name__ == "__main__":
    run()

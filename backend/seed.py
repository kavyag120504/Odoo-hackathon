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


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Employee).count() > 0:
            print("Seed skipped: employees already exist.")
            return

        eng = Department(name="Engineering")
        ops = Department(name="Operations")
        db.add_all([eng, ops])
        db.flush()  # assign ids

        people = [
            ("Admin User", "admin@assetflow.dev", Role.ADMIN, eng),
            ("Asset Manager", "manager@assetflow.dev", Role.ASSET_MANAGER, eng),
            ("Dept Head A (Eng)", "heada@assetflow.dev", Role.DEPARTMENT_HEAD, eng),
            ("Dept Head B (Ops)", "headb@assetflow.dev", Role.DEPARTMENT_HEAD, ops),
            ("Employee One", "emp1@assetflow.dev", Role.EMPLOYEE, eng),
            ("Employee Two", "emp2@assetflow.dev", Role.EMPLOYEE, ops),
        ]
        created = []
        for name, email, role, dept in people:
            e = Employee(
                name=name,
                email=email,
                password_hash=hash_password(DEMO_PASSWORD),
                role=role.value,
                department_id=dept.id,
                status=UserStatus.ACTIVE.value,
            )
            db.add(e)
            created.append(e)
        db.flush()

        # Wire department heads.
        eng.head_id = created[2].id
        ops.head_id = created[3].id

        db.commit()
        print(f"Seeded {len(people)} employees across 2 departments.")
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

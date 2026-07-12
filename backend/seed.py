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
    finally:
        db.close()


if __name__ == "__main__":
    run()

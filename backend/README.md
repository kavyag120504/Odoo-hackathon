# AssetFlow — Backend (FastAPI)

Shared base + Person B modules (Auth, RBAC, Booking).

## Stack
FastAPI · SQLAlchemy 2 · Pydantic v2 · JWT session tokens · PostgreSQL (SQLite locally by default).

## Run
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # SQLite by default; set DATABASE_URL for Postgres
python seed.py                  # demo accounts (one per role, 2 departments)
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs · Health: http://localhost:8000/health

## Demo accounts (password `password123`)
| Email | Role | Dept |
|---|---|---|
| admin@assetflow.dev | Admin | Engineering |
| manager@assetflow.dev | Asset Manager | Engineering |
| heada@assetflow.dev | Department Head | Engineering |
| headb@assetflow.dev | Department Head | Operations |
| emp1@assetflow.dev | Employee | Engineering |
| emp2@assetflow.dev | Employee | Operations |

## Auth (Commit 1)
- `POST /auth/signup` — always creates **Employee**. No `role` field; an injected `role` is ignored.
- `POST /auth/login` — returns `access_token` (Bearer) and sets an httponly `session` cookie.
- `GET /auth/me` — current user (requires auth).
- `POST /auth/logout`, `POST /auth/forgot-password` (stub).

Auth clients: send `Authorization: Bearer <token>` **or** rely on the `session` cookie.

## RBAC (Commit 2)
Reusable authorization lives in `app/core/rbac.py`:
- `require_role(*roles)` — dependency factory; 403 if the user lacks the role (Admin always allowed).
- `ensure_department_scope(user, department_id)` — 403 unless the user may act on that dept (Admin/Asset Manager = any; Department Head = own only).

```python
from app.core.rbac import require_role, ensure_department_scope
from app.models.employee import Role

@router.post("/assets", dependencies=[Depends(require_role(Role.ASSET_MANAGER, Role.ADMIN))])
def create_asset(...): ...
```
Demo endpoint: `PATCH /employees/{id}/role` (Admin-only) — the "Admin promotes to Asset Manager" flow; hitting it as an Employee returns **403**.

## For teammates (Person A/C/D)
- Add new models under `app/models/` and import them in `app/models/__init__.py`.
- Reuse `get_db` (`app.database`), `get_current_user` (`app.core.deps`), and the role-gate in `app.core.rbac`.
- `email`, and later `asset_tag`/`qr_code`, carry **DB-level** unique constraints, not just app checks.

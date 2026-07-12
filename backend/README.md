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

## For teammates (Person A/C/D)
- Add new models under `app/models/` and import them in `app/models/__init__.py`.
- Reuse `get_db` (`app.database`) and, once Commit 2 lands, the role-gate in `app.core.deps`.
- `email`, and later `asset_tag`/`qr_code`, carry **DB-level** unique constraints, not just app checks.

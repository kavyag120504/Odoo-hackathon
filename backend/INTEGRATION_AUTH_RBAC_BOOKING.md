# Integration guide — Auth / RBAC / Booking (Person B)

How A / C / D plug into the shared auth, authorization, and booking layer.
Everything below is live on `main` and verified (`python verify_personb.py` → 18/18).

## 1. Auth contract (frontend + API clients)

- Log in: `POST /auth/login` `{email, password}` → `{ access_token, user }`. Signup: `POST /auth/signup` (creates **Employee** only — no `role` field; an injected `role` is ignored).
- Send the token as **`Authorization: Bearer <access_token>`** (an httponly `session` cookie is also set). The React app already does this via `frontend/src/api/client.js` — reuse `api("/path", { method, body })`.
- Current user: `GET /auth/me` → `{id, name, email, role, department_id, status}`.
- `role` ∈ `"Employee" | "Department Head" | "Asset Manager" | "Admin"`. `status` ∈ `"Active" | "Inactive"`.
- Errors are FastAPI default `{"detail": ...}`. 401 = not authenticated, 403 = wrong role/scope, 409 = conflict (e.g. duplicate), 422 = bad body.

## 2. Protecting your endpoints (backend) — `app/core/rbac.py`

```python
from fastapi import Depends
from app.core.deps import get_current_user
from app.core.rbac import require_role, ensure_department_scope
from app.models.employee import Role

# Role-gate a whole route (Admin is always allowed):
@router.post("/assets", dependencies=[Depends(require_role(Role.ASSET_MANAGER, Role.ADMIN))])
def create_asset(...): ...

# Dept-scoped approval (Dept Head A must not approve Dept B) — use inside the handler:
@router.post("/transfers/{tid}/approve")
def approve(tid: int, user = Depends(get_current_user), db = Depends(get_db)):
    transfer = db.get(TransferRequest, tid)
    ensure_department_scope(user, transfer.department_id)   # raises 403 if out of scope
    ...
```
- `require_role(*roles)` → 403 if the user lacks the role.
- `can_act_on_department(user, dept_id)` / `ensure_department_scope(user, dept_id)`: Admin & Asset Manager = any dept; Department Head = own dept only; others = no.
- **Person A**: reuse `ensure_department_scope` for transfer/return approvals — it's exactly the "Dept Head A ≠ Dept B" rule.

## 3. Protecting screens (frontend)

- Add your route to `frontend/src/layout/nav.js` (`roles: [...]` to restrict; omit for all). The Sidebar renders from this automatically, and `ProtectedRoute` shows an in-app 403 for blocked roles — mirrors the backend gate.
- Wrap pages in the existing `AppShell`; read the user via `useAuth()`.

## 4. Booking endpoints (if you need the Reserved state)

- `GET /bookings/asset-statuses` → bookable assets with a **live `effective_status`** (`Reserved` is derived from active bookings, never a stored flag). Use this for the registry/dashboard "Reserved" badge — don't recompute it.
- `GET /bookings?asset_id=` · `POST /bookings` · `PATCH /bookings/{id}/cancel` (booker or Asset Manager/Admin; frees the slot).
- The 7-state lifecycle enum lives in `app/models/enums.py` (`AssetStatus`) — shared by all modules; don't redefine it.

## 5. Verify you didn't break auth/RBAC/booking

`cd backend && source .venv/bin/activate && python verify_personb.py` — runs 18 edge-case checks on an isolated DB/port. Run it after merging anything that touches these areas.

# AssetFlow — Frontend (React + Vite + Tailwind)

Shared app shell + auth. Dark theme, green accent (per mockup).

## Run
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```
Backend must be running on :8000 (Vite proxies `/api/*` → FastAPI, so the app is single-origin — no CORS pain).

## What's here (Commit 2)
- `auth/AuthContext.jsx` — session state, `login`/`signup`/`logout`, `/auth/me` on load. Token in localStorage.
- `auth/Login.jsx`, `auth/Signup.jsx` — signup has **no role field** by design.
- `auth/ProtectedRoute.jsx` — unauth → `/login`; role-blocked → in-app 403 (mirrors backend gate).
- `layout/Sidebar.jsx` + `AppShell.jsx` — the **conditional nav** every screen renders inside.
- `layout/nav.js` — **single source of truth** for nav items + role visibility.
- `api/client.js` — fetch wrapper (Bearer token, normalized errors, offline-safe).

## Adding your screen (Person A/C/D)
1. Add/confirm your route in `layout/nav.js` (set `roles` if restricted).
2. Replace the matching `<Placeholder … />` in `App.jsx` with your page.
3. Fetch live data via `api("/your-endpoint")` from `api/client.js` — **no static JSON**.

That's it — auth, session, the sidebar, and the 403 handling are already wired around your page.

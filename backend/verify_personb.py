#!/usr/bin/env python3
"""Person B (Auth / RBAC / Booking) — full edge-case verification pass.

Walks every B-owned row of the spec's edge-case table against a live server.
Stdlib only (no test deps). Boots its own uvicorn on an isolated DB, runs the
checks, tears down, and exits non-zero if anything fails.

    cd backend && source .venv/bin/activate && python verify_personb.py
"""

import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

PORT = 8011  # dedicated port to avoid clashing with a dev server on 8000
BASE = f"http://127.0.0.1:{PORT}"
DB_FILE = "verify.db"

GREEN, RED, RESET = "\033[32m", "\033[31m", "\033[0m"
_passed = _failed = 0


def check(label, expected, actual):
    global _passed, _failed
    ok = expected == actual
    mark = f"{GREEN}PASS{RESET}" if ok else f"{RED}FAIL{RESET}"
    detail = f"({actual})" if ok else f"(got {actual!r}, expected {expected!r})"
    print(f"  {label:<50} {mark} {detail}")
    _passed += ok
    _failed += not ok


def req(method, path, body=None, token=None):
    """Return (status_code, parsed_json_or_None)."""
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, None


def token_for(email, password="password123"):
    _, data = req("POST", "/auth/login", {"email": email, "password": password})
    return (data or {}).get("access_token", "")


def wait_healthy(timeout=25):
    for _ in range(int(timeout * 2)):
        try:
            with urllib.request.urlopen(BASE + "/health", timeout=1):
                return True
        except Exception:
            time.sleep(0.5)
    return False


def main():
    env = dict(os.environ, DATABASE_URL=f"sqlite:///./{DB_FILE}")

    # Fresh isolated DB + seed.
    for f in (DB_FILE,):
        if os.path.exists(f):
            os.remove(f)
    subprocess.run([sys.executable, "seed.py"], env=env, check=True,
                   stdout=subprocess.DEVNULL)

    proc = subprocess.Popen(
        ["uvicorn", "app.main:app", "--port", str(PORT)],
        env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        if not wait_healthy():
            print(f"{RED}Server did not become healthy — aborting.{RESET}")
            return 1

        admin = token_for("admin@assetflow.dev")
        emp = token_for("emp1@assetflow.dev")
        emp2 = token_for("emp2@assetflow.dev")

        print("\n=== AUTH ===")
        _, d = req("POST", "/auth/signup",
                   {"name": "Eve", "email": "eve@x.dev", "password": "secret123", "role": "Admin"})
        check("Signup ignores injected role:Admin", "Employee", (d or {}).get("user", {}).get("role"))
        s, _ = req("POST", "/auth/signup", {"name": "Eve2", "email": "eve@x.dev", "password": "secret123"})
        check("Duplicate email signup -> 409", 409, s)
        s, _ = req("POST", "/auth/login", {"email": "admin@assetflow.dev", "password": "wrong"})
        check("Login wrong password -> 401", 401, s)
        s, _ = req("GET", "/auth/me")
        check("/auth/me without token -> 401", 401, s)

        print("\n=== RBAC ===")
        # Target id 3 (a Dept Head) so emp2 (id 6) stays a plain Employee for the
        # non-booker cancel test below.
        s, _ = req("PATCH", "/employees/3/role", {"role": "Admin"}, token=emp)
        check("Employee hits Admin-only promote -> 403", 403, s)
        s, _ = req("PATCH", "/employees/3/role", {"role": "Asset Manager"}, token=admin)
        check("Admin promotes employee -> 200", 200, s)
        # Dept-scope guard tested directly (no dept-scoped HTTP route is B's yet;
        # transfer approval (A) will consume this same helper).
        from app.core.rbac import can_act_on_department
        from app.models.employee import Employee, Role
        head_a = Employee(role=Role.DEPARTMENT_HEAD.value, department_id=1)
        check("Dept-scope: Head A cannot act on Dept B", False, can_act_on_department(head_a, 2))
        check("Dept-scope: Head A can act on own Dept A", True, can_act_on_department(head_a, 1))

        print("\n=== BOOKING ===")
        D = "2026-08-01"
        s, _ = req("POST", "/bookings",
                   {"asset_id": 1, "start_time": f"{D}T09:00:00", "end_time": f"{D}T10:00:00"}, token=emp)
        check("Book 09-10 -> 201", 201, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 1, "start_time": f"{D}T09:30:00", "end_time": f"{D}T10:30:00"}, token=emp)
        check("Overlap 09:30-10:30 -> 409", 409, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 1, "start_time": f"{D}T10:00:00", "end_time": f"{D}T11:00:00"}, token=emp)
        check("Boundary 10:00-11:00 -> 201 (succeeds)", 201, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 5, "start_time": f"{D}T09:00:00", "end_time": f"{D}T10:00:00"}, token=emp)
        check("Non-bookable asset -> 409", 409, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 4, "start_time": f"{D}T09:00:00", "end_time": f"{D}T10:00:00"}, token=emp)
        check("Under-Maintenance asset -> 409", 409, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 1, "start_time": f"{D}T11:00:00", "end_time": f"{D}T10:00:00"}, token=emp)
        check("start >= end -> 422", 422, s)

        # Reserved derivation + cancel-frees-slot on a fresh asset (id 2).
        req("POST", "/bookings",
            {"asset_id": 2, "start_time": f"{D}T14:00:00", "end_time": f"{D}T15:00:00"}, token=emp)
        _, statuses = req("GET", "/bookings/asset-statuses", token=emp)
        eff = next((r["effective_status"] for r in statuses if r["asset_id"] == 2), None)
        check("Reserved derived after booking asset 2", "Reserved", eff)

        _, blist = req("GET", "/bookings?asset_id=2", token=emp)
        bid = blist[0]["id"]
        s, _ = req("PATCH", f"/bookings/{bid}/cancel", token=emp2)
        check("Non-booker cancels other's booking -> 403", 403, s)
        s, _ = req("PATCH", f"/bookings/{bid}/cancel", token=emp)
        check("Booker cancels own booking -> 200", 200, s)
        s, _ = req("POST", "/bookings",
                   {"asset_id": 2, "start_time": f"{D}T14:00:00", "end_time": f"{D}T15:00:00"}, token=emp)
        check("Cancel frees slot: rebook same window -> 201", 201, s)

    finally:
        proc.send_signal(signal.SIGINT)
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        if os.path.exists(DB_FILE):
            os.remove(DB_FILE)

    print("\n" + "=" * 56)
    color = GREEN if _failed == 0 else RED
    print(f"  RESULT: {color}{_passed} passed, {_failed} failed{RESET}")
    print("=" * 56)
    return 1 if _failed else 0


if __name__ == "__main__":
    sys.exit(main())

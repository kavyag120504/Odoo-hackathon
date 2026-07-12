# AssetFlow — Enterprise Asset & Resource Management System

Hackathon build for the Odoo virtual round. This repo starts at the ideation-complete /
pre-code checkpoint: problem statement fully mapped, schema finalized, screen-by-screen
feature breakdown done, business rules and edge cases identified, and the team split assigned.
Code implementation starts from this commit onward.

## Problem statement summary

An ERP-style platform for organizations to track physical assets and shared resources through
a full lifecycle — registration, allocation, booking, maintenance, and audit — with strict
role-based workflows and no self-elevating account creation.

Full spec: see `docs/PLANNING.md`. Mockup reference (10 screens, dark theme, rounded cards,
green accents): https://app.excalidraw.com/l/65VNwvy7c4X/5ceOBMjbDby

## Confirmed screens (10)

1. Login / Signup
2. Dashboard
3. Organization Setup (Departments / Categories / Employee Directory)
4. Asset Registry
5. Asset Allocation & Transfer
6. Resource Booking
7. Maintenance (kanban)
8. Asset Audit
9. Reports & Analytics
10. Notifications & Activity Log

## Roles

- **Admin** — org setup, promotes employees to Department Head / Asset Manager (the only
  place roles are ever assigned)
- **Asset Manager** — registers/allocates assets, approves transfers, maintenance, returns, and
  audit discrepancy resolution
- **Department Head** — views/approves within their own department, books resources on its
  behalf
- **Employee** — views own allocations, books resources, raises maintenance requests, initiates
  returns/transfers

## Core entities

`departments`, `employees`, `asset_categories`, `assets`, `allocations`, `transfer_requests`,
`return_requests`, `bookings`, `maintenance_requests`, `audit_cycles`, `audit_auditors`,
`audit_items`, `notifications`, `activity_log`

Full field-level schema: see `docs/SCHEMA.md`

## Key business rules

- No double allocation — conflicting requests are blocked and redirected to a Transfer Request
- Returns are two-step: Employee initiates → Asset Manager approves with condition notes
- Booking overlap is rejected on `new.start < existing.end AND new.end > existing.start`;
  back-to-back bookings are allowed
- Maintenance is a 5-state workflow (Pending → Approved → Technician Assigned → In Progress
  → Resolved); asset only flips to Under Maintenance on Approved, back to Available on Resolved
- Audit Cycles lock on close; Missing items auto-flip to Lost; Damaged items auto-raise a
  Maintenance Request
- QR code is a required field on every asset (auto-generated); the camera-scanning UI is
  optional polish only

Full edge-case checklist: see `docs/EDGE_CASES.md`

## Tech stack (proposed)

- Backend: FastAPI + PostgreSQL + SQLAlchemy
- Frontend: React + Tailwind
- Auth: email/password + session, RBAC middleware

## Repo structure

See `docs/PLANNING.md` for the full hour-by-hour build order this structure is designed around.

```
assetflow/
├── README.md                  ← you are here
├── docs/
│   ├── PLANNING.md            ← hour-by-hour execution plan
│   ├── SCHEMA.md               ← full entity/field reference
│   └── EDGE_CASES.md          ← edge-case checklist + demo script
├── backend/
│   ├── src/
│   │   ├── models/            ← ORM models, one file per entity
│   │   ├── routes/             ← API endpoints, grouped by module
│   │   ├── services/           ← business logic (allocation, booking overlap, audit close, etc.)
│   │   └── db/                 ← DB connection/session setup
│   ├── migrations/             ← schema migration scripts
│   └── seed/                   ← seed data scripts
└── frontend/
    └── src/
        ├── components/          ← shared UI components
        ├── pages/                ← top-level routed pages
        ├── screens/              ← one folder per mockup screen (1–10)
        └── api/                  ← API client functions
```
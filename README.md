# Q BMS v2.3.0.1

Q Business Management System (Q BMS) is iQuri's internal web-based business management platform.

## Technology Stack

- Frontend: Next.js 16.3.3 + React 19.2.8 + TypeScript 7.0.2 + Tailwind CSS 4.3.3
- Backend: Node.js + Express 5.2.1
- Database: PostgreSQL via pg 8.23.0
- Backend architecture: Route → Controller → Service → Repository → PostgreSQL
- Application: Web-based

Dependencies are pinned to the versions already resolved in the repository lockfiles. Do not use `latest` for Q BMS runtime dependencies.

## Canonical Architecture

1. **Core Platform** — Authentication, Session, Access Control, Role, Permission, Configuration, Audit, Platform Registry.
2. **Shared Modules** — Employee, Organization, Customer, Product, Supplier/Vendor, Location/Site, Asset, Document, Task & Approval, Notification.
3. **Employee Workspace** — employee self-service surfaces such as Profile, Employment, Assets and future Attendance/Leave/KPI/Tasks/Requests.
4. **Business Tools** — HRM, Inventory, Installation, Procurement, Financial, Management Dashboard. CRM remains **HOLD / RESERVED**.
5. **QA / Development** — E2E QA, Preview As, Test Employee and Platform Diagnostics.

Department remains **HOLD**: its schema is reserved for compatibility, but Department API/UI/business logic must not be exposed until the module is explicitly activated.

## Current Foundation

Implemented foundations include:

- Google Workspace SSO, HttpOnly session and local-only Development Preview
- Role / Permission engine and Level / Grade policy
- User Access Assignment and Effective Permission Preview
- Super Admin hub, User & Identity, Audit Log, Role/Permission Management, Module Management, System Configuration and Platform Diagnostics
- Organization: Business Unit, 6 Levels / 14 Grades, Job Family, Position and multi-Grade Position mapping
- Employee Master + Employee Assignment
- Reporting Lines management: PRIMARY / DOTTED Manager, effective dates, cycle detection, history and audit; runtime Manager resolution uses Reporting Lines first with a temporary legacy fallback
- IT Account Setup → Invitation → Google Identity Link → Self-Onboarding → HR Review → Asset Gate → Activation → Employee Workspace
- Asset and Notification shared foundations used by onboarding
- English / Lao / Thai UI foundation

## Repository

```text
q-bms/
├── frontend/
├── backend/
├── database/
├── docs/
└── package.json
```

Legacy one-off patch installers are intentionally not part of the canonical source tree.

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
# Fill real local values in .env
npm install
npm run dev
```

Default API: `http://localhost:4000`  
Health: `GET /api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default web: `http://localhost:3000`

## Verification

Run the architecture guard and unit checks:

```bash
npm run verify
```

The verification is dependency-light and uses the current source tree; it checks critical security/architecture invariants and the canonical onboarding-state resolver.

A GitHub Actions workflow at `.github/workflows/qbms-verify.yml` runs dependency installation, architecture/unit verification and the Frontend build on push/PR when the repository is hosted on GitHub.

## Migration Rule

Google Apps Script implementation details are not copied directly. Legacy capabilities are classified as **KEEP**, **REFACTOR**, **MERGE**, **SPLIT**, **DROP** or **VERIFY**.

See `docs/migration/QBMS_GS_MIGRATION_MAP.md` and `docs/migration/MIGRATION_STATUS.md`.


## Reporting Lines v2.3.0.1

Reporting relationships are stored between **Employee Assignments**, not inferred from Job Grade. The management UI supports one current PRIMARY Manager, multiple DOTTED Managers, effective dates, non-destructive history, cycle detection and audit events. Future-dated manager scheduling remains intentionally disabled until the workspace date-resolution path is upgraded.

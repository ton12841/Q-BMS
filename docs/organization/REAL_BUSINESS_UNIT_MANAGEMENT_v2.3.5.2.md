# Q BMS v2.3.5.2 — Real Business Unit Management Repair

This replaces the failed v2.3.5.1 attempt.

## Root causes fixed
1. v2.3.5.1 had a fragile source-import anchor and stopped before applying the feature.
2. Frontend Next.js was still running while the installer/restore process removed `.next`, so Next.js could recreate files concurrently and leave the Frontend in a failed state.

## Safety change
The installer now refuses to run while port 3000 is active.
Stop Frontend with Ctrl+C before installing.

## Real Business Unit
- Add
- Edit
- ACTIVE / INACTIVE
- Delete only when unused
- organization.master.manage backend permission
- Audit Log writes
- dependency-safe delete

No DB migration.
No npm install.
Installer must pass architecture/unit verification and full production build.

# Q BMS v2.2.4.5 — Super Admin Repair Installer Fix

v2.2.4.4 contained the correct repair payload but its installer used the local
TypeScript runtime API for syntax checking. On the current Mac environment that
API does not expose `ts.ScriptTarget.ES2022`, so the installer rolled back.

v2.2.4.5 removes that environment-dependent check.

## Repair applied directly

- Replace corrupted `SuperAdminHubPageClient.tsx` with known-good source
- Remove invalid `href: "/super-admin",checking`
- Restore Super Admin Hub route
- Sidebar Super Admin and Modules & Tools Super Admin both resolve to `/super-admin`
- Clear `frontend/.next`

No database migration.
No backend change.
No npm install.

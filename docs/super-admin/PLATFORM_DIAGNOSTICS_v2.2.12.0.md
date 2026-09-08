# Q BMS v2.2.12.0 — Platform Diagnostics Foundation

## Purpose

Adds a read-only integrity screen under:

Super Admin → System Administration → Platform Diagnostics

## Checks

- PostgreSQL connectivity
- Core schema tables
- Organization schema tables
- Onboarding schema tables
- Super Admin schema tables
- EMPLOYEE / SUPER_ADMIN role integrity
- System Permission bindings to SUPER_ADMIN
- 6 canonical Job Levels
- Grade 1–14
- Business Unit availability
- Position Master readiness
- 10 Module / 9 Tool platform registry
- CRM HOLD / RESERVED
- System Configuration registry
- Department HOLD
- en / lo / th localization configuration
- Audit Log infrastructure
- Onboarding foundation

## Important status rule

`WAITING` is not a system failure.

For example:
- Level / Grade can be READY
- Position Master can still be WAITING for real company Position data

That allows diagnostics to distinguish business-data dependencies from technical defects.

## Shared icon hardening

Adds the missing shared icon contracts already referenced by recent Super Admin screens:

- plus
- info
- lock
- pause

## Permission

`system.platform_diagnostics.view`

Granted to SUPER_ADMIN.

## Route

`/super-admin/system-administration/diagnostics`

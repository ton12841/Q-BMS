# Q BMS v2.2.7.0 — Super Admin Information Architecture

## Canonical Super Admin structure

Super Admin is now organized into four primary administration areas.

### 1. System Administration
- User & Identity Management — READY
- System Configuration — PLANNED

### 2. Roles & Permissions
- User Access Assignment — READY
- Role Management — PLANNED
- Permission Management — PLANNED
- Level / Grade Policy — READY
- Effective Permission Preview — READY

### 3. Module Management
- Module / Tool Administration — PLANNED

### 4. Audit Log
- Audit Log — READY

## Naming correction

The existing `Access Control` screen is now presented in the UI as:

`User Access Assignment`

because its actual responsibility is assigning Admin / System Roles to individual users.

The term `Access Control` remains an architectural concept covering:
- Permission
- Role
- Policy
- User assignment
- Effective access

The existing route remains `/super-admin/access-control` to avoid unnecessary routing churn.

## Definitions

- Permission = atomic capability
- Role = reusable set of Permissions
- Policy = Level / Grade Permission behavior
- User Access Assignment = assign Roles to a User
- Effective Access = final resolved result

## No destructive changes

- No DB migration
- No backend changes
- Existing ready tools are reused
- Planned tools remain disabled
- Super Admin sidebar and Modules & Tools entry behavior from v2.2.5.1 is preserved

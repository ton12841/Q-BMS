# Q BMS v2.2.8.0 — Role Management Foundation

## Purpose

Adds real Role Management under:

Super Admin → Roles & Permissions → Role Management

## Role model

- Permission = atomic capability
- Role = reusable set of Permissions
- User Access Assignment = assign Role to a User
- Effective Access = final result after Role + Level / Grade Policy

## Management rules

### Protected
`EMPLOYEE`
- canonical Base Role
- no edits from Role Management

`SUPER_ADMIN`
- special System Role
- no edits from Role Management

### Built-in Admin Roles
Examples:
- HR Admin
- IT Admin
- Inventory Admin
- Procurement Admin
- Finance Admin
- Installation Admin
- Management Admin

Their identity/definition remains locked, but Super Admin may maintain the
Permission membership of those Admin Roles.

### Custom Admin Roles
Super Admin may:
- create
- edit Name / Description
- edit Permission membership
- set ACTIVE / INACTIVE

Custom Roles:
- are always `ADMIN`
- are assignable
- cannot be hard-deleted from this UI

## Audit

Creates:
- `ROLE_MANAGEMENT.ROLE_CREATED`
- `ROLE_MANAGEMENT.ROLE_UPDATED`

## i18n

English / Lao / Thai supported from first release.

## Permissions

- `system.role_management.view`
- `system.role_management.manage`

Granted to `SUPER_ADMIN`.

## Route

`/super-admin/roles-permissions/roles`

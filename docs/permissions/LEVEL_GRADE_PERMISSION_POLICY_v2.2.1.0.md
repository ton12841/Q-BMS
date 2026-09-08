# Q BMS v2.2.1.0 — Level / Grade Permission Policy

## Purpose

This patch implements the previously agreed Employee access rule:

`EMPLOYEE Base Role + Job Level Policy, with Job Grade overriding Job Level`

Admin roles remain additive and independent from Position / Grade / Level.

## Evaluation order

1. Role permissions are collected from assigned roles.
2. Job Level grants Employee-policy permissions as defaults.
3. Job Grade can:
   - `GRANT` a permission that Level did not grant.
   - `REVOKE` a permission that Level granted.
   - omit an override to inherit the Level result.
4. Final effective permissions are:

`Role Permissions UNION Effective Level/Grade Permissions`

Important: a Grade `REVOKE` only overrides the Level policy layer. It does **not** remove a permission granted by an explicit Role.

## No invented Grade rules

This patch does not assign any permissions to any Level or Grade automatically.

It only creates the policy engine and administration UI. The actual permission policy remains empty until Super Admin configures it.

## Policy-eligible permissions

The policy layer is restricted to Employee / Organization capabilities and cannot grant Admin Tool or System permissions.

The following future Employee Workspace capability definitions are added without granting them:

- My Attendance
- My Leave
- My KPI & Performance
- My Tasks
- My Requests
- Notifications

## UI

Route:

`/super-admin/access-control/organization-policy`

The Access Control page also links to this policy screen.

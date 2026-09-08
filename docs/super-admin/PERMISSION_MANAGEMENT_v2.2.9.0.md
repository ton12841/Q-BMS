# Q BMS v2.2.9.0 — Permission Management Foundation

## Purpose

Adds:

Super Admin → Roles & Permissions → Permission Management

## Foundation mode

Read-only catalog.

Permission Code is treated as an application contract because application code
and middleware refer to these codes directly.

Therefore this release does NOT allow:
- create permission
- rename permission code
- delete permission
- edit permission metadata

## View capabilities

- Permission Code
- Name
- Description
- Group
- Level / Grade Policy eligibility
- Role usage
- Active Role usage
- unused Permission detection
- search/filter by Group / Policy eligibility / Role usage

## Ownership

- Role membership → Role Management
- Level / Grade policy behavior → Level / Grade Policy
- future Permission registration lifecycle → Module Management

## Permission

`system.permission_management.view`

Granted to SUPER_ADMIN.

## i18n

English / Lao / Thai supported.

## Route

`/super-admin/roles-permissions/permissions`

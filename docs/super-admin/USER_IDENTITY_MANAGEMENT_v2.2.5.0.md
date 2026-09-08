# Q BMS v2.2.5.0 — User & Identity Management Foundation

## Purpose

Adds the next Super Admin capability after Access Control.

The first release is intentionally **read-only**.

Super Admin can inspect:

- Q BMS User account
- linked Employee
- company email / Q BMS email
- Google identity linked / unlinked
- account status
- Employee / profile status
- active primary organization assignment
- most recent invitation state
- first login / last login
- active session count
- assigned Roles

## Why read-only first

Account suspension, Google identity unlinking and destructive user actions affect authentication and employee access. These actions are not exposed until their business rules, audit requirements and recovery flow are explicitly defined.

Role changes continue to use **Access Control**.

## Route

`/super-admin/user-identity`

## Permissions

- `system.user_identity.view`
- `system.user_identity.manage` (reserved for controlled actions later)

Both are assigned to `SUPER_ADMIN`. Development Preview remains allowed by the existing local-development permission middleware.

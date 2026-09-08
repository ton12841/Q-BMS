# Q BMS v2.2.2.0 — Effective Permission Preview

## Purpose

Provides the agreed QA / Preview As capability for Access Control without modifying real user data.

## Modes

### Actual User
Select a Q BMS user and inspect the current effective permissions using:

- assigned Role(s)
- current active primary Employee assignment
- Job Level default permission policy
- Job Grade GRANT / REVOKE override

### Simulation
Select:

- Role(s)
- Job Level
- Job Grade

and calculate the result without persisting anything.

## Effective rule

`Role Permissions UNION (Job Level after Job Grade override)`

A Job Grade REVOKE can remove only the Job Level grant. It cannot remove an explicit permission granted by a Role.

## Safety

- Read-only
- No Save / Delete / Role update
- No Employee assignment update
- No Permission policy update
- Simulation result is never persisted
- Existing Access Control view permission protects the route in production

## UI

`/super-admin/access-control/effective-preview`

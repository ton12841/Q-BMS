# Q BMS v2.2.3.0 — User Access Assignment

## Purpose

Makes the Access Control UI match the canonical access model:

1. `EMPLOYEE` is an automatic Base Role for employee-linked users.
2. Job Level permission policy is inherited from Organization.
3. Job Grade can override Job Level.
4. Admin / System roles are assigned per user.
5. Effective Permission Preview explains the final result.

## What Super Admin edits on this screen

Only:
- HR Admin
- IT Admin
- Inventory Admin
- Procurement Admin
- Finance Admin
- Installation Admin
- Management Admin
- SUPER_ADMIN

## What Super Admin does not edit on this screen

- EMPLOYEE Base Role
- Business Unit
- Position
- Job Level
- Job Grade
- Level / Grade permission policy

Those come from their respective source-of-truth modules.

## Safety

- Employee-linked users cannot lose EMPLOYEE through role assignment.
- SUPER_ADMIN remains independent from Position / Level / Grade.
- No Super Admin is auto-created.
- Role changes remain audited.

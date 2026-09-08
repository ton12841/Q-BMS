# Q BMS v2.2.0.0 — Access Control Foundation

## Canonical model

Q BMS separates organizational identity from system access.

```text
Employee / Organization
- Business Unit
- Position
- Job Grade
- Job Level

Q BMS Access Control
- EMPLOYEE base role
- Admin second roles
- SUPER_ADMIN special role
- Permissions / capabilities
```

## Role rules

1. `EMPLOYEE` is the canonical base/first role for employee-linked users.
2. Admin roles are additive second roles.
3. `SUPER_ADMIN` is independent from Position, Grade and Level.
4. No user or email is automatically assigned `SUPER_ADMIN`.
5. The existing codes `HR_EMPLOYEE_ADMIN` and `IT_ACCOUNT_ADMIN` are preserved because current onboarding workflows and notifications already reference them.
6. Level / Grade permission policy remains a separate access-policy layer. Grade overrides Level when both define the same Employee capability.

## Canonical roles

- EMPLOYEE
- HR_EMPLOYEE_ADMIN — UI name: HR Admin
- IT_ACCOUNT_ADMIN — UI name: IT Admin
- INVENTORY_ADMIN
- PROCUREMENT_ADMIN
- FINANCE_ADMIN
- INSTALLATION_ADMIN
- MANAGEMENT_ADMIN
- SUPER_ADMIN

## Access Control UI

Route:

`/super-admin/access-control`

A shortcut appears in the user menu for:
- Development Preview
- Super Admin
- users with `system.access_control.view`

Development Preview may use Access Control only outside production because the existing permission middleware already restricts that bypass to non-production environments.

## Security

- Production role assignment requires `system.access_control.manage`.
- Only `SUPER_ADMIN` receives that permission in this foundation.
- Employee-linked users cannot lose the `EMPLOYEE` base role through the UI.
- A Super Admin cannot remove their own `SUPER_ADMIN` role through the UI.
- Role changes are written to `audit_logs`.
- No Super Admin is auto-created or hard-coded.

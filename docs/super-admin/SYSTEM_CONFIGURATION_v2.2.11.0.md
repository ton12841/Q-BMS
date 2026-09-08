# Q BMS v2.2.11.0 — System Configuration Foundation

## Purpose

Completes the fourth Super Admin administration area with a canonical
read-only platform configuration registry.

## Canonical settings seeded

Authentication
- Google Workspace Domain = iquritech.com
- Google SSO Required = true

Access Control
- Base Employee Role = EMPLOYEE
- SUPER_ADMIN assignment = EXPLICIT
- Employee Permission Model = Role + Level / Grade Policy

Organization
- Department = HOLD
- Position may support multiple Grades

Onboarding
- Canonical onboarding state progression

Localization
- en / lo / th

Platform
- CRM = HOLD

## Security

This registry intentionally excludes:
- passwords
- API secrets
- OAuth credentials
- session secrets
- database URLs
- runtime environment values

## Mutability

All canonical settings are `LOCKED` in this foundation.

Future editable settings require:
- validation
- approval
- audit log
- safe rollback semantics

## Permission

`system.configuration.view`

Granted to SUPER_ADMIN.

## i18n

English / Lao / Thai.

## Route

`/super-admin/system-administration/configuration`

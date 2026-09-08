# Q BMS Current Architecture — v2.2.14.0

## Core Platform

Authentication, Session, Access Control, Role, Permission, System Configuration, Audit Log and Platform Registry are Core Platform capabilities.

`SUPER_ADMIN` is explicit and independent from Position / Job Level / Job Grade.

Development Preview is local-development-only and is not an Employee identity.

## Shared Modules

Canonical Shared Modules:

- Employee
- Organization
- Customer
- Product
- Supplier / Vendor
- Location / Site
- Asset
- Document
- Task & Approval
- Notification

Business Tools must reuse these owners instead of creating duplicate masters.

## Organization

Current source-of-truth relationship:

```text
Employee
  -> Employee Assignment
       -> Business Unit
       -> Position
       -> Job Grade
            -> Job Level

Employee Assignment
  -> Reporting Line
       -> Manager Employee Assignment
```

Position is a global master and can support multiple Job Grades. Business Unit belongs to Employee Assignment. Reporting Line must never be inferred from Grade alone.

Department remains `HOLD`. The database columns/table are reserved for compatibility only. No Department API/UI/business behavior is exposed.

## Access Control

```text
Effective Employee Access
  = Role Permissions
  UNION
    Organization Policy
      where Grade overrides Level for the same policy Permission
```

Grade cannot revoke an explicit Role Permission.

Organization API:

- Read: `organization.master.view`
- Write: `organization.master.manage`

## Employee Onboarding

Canonical state names are resolved centrally from underlying source fields. They are not stored as one overloaded employee status column.

```text
PRE_ONBOARDING
-> IT_ACCOUNT_PENDING
-> IT_ACCOUNT_READY
-> INVITATION_SENT
-> ONBOARDING
-> PENDING_REVIEW
-> ASSET_PENDING
-> READY_TO_ACTIVATE
-> ACTIVE
```

Underlying source-of-truth fields remain in Employee, IT Account Setup, Invitation, User Account, Onboarding Case and Tasks.

## Backend Dependency Rule

```text
Route -> Controller -> Service -> Repository -> PostgreSQL
```

Cross-domain business access should go through a domain Service. For example, HRM Onboarding Review calls the Employee Onboarding Service rather than importing the Employee repository directly.

## Current Transitional Compatibility

`employees.manager_employee_id` is legacy compatibility only. Employee Workspace now prefers `employee_reporting_lines`; the legacy field remains a temporary fallback until Reporting Lines management and migration are complete.

`positions.business_unit_id`, `positions.job_grade_id`, `employees.primary_business_unit_id`, `employees.position_id` and `employees.job_level` remain compatibility fields and are not the revised architecture source of truth.

## Next Structural Work

1. Reporting Lines management API/UI, cycle detection and history.
2. Real Position Master data.
3. Real Employee Onboarding E2E.
4. Continue HRM functional modules.

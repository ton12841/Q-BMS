# Q BMS v2.3.1.0 — Employee Organization Assignment Management

## Scope

Completes the controlled Organization Assignment workflow for an Employee.

Canonical chain:

Employee
→ Employee Assignment
→ Business Unit
→ Position
→ Job Grade
→ Job Level (derived)
→ Primary Manager via Reporting Lines
→ Assignment History

Department remains HOLD.

## History rule

For an ACTIVE Employee, Employee Master can no longer overwrite the current
Business Unit / Position / Job Grade row.

A real organization change must create a new Assignment Transition.

Pre-onboarding employees can still correct their initial assignment before
activation.

## Transition types

- TRANSFER
- PROMOTION
- LATERAL_MOVE
- CORRECTION

Existing historical records created before this release are marked LEGACY.

## Reporting continuity

When an Employee changes Assignment:

1. Old assignment is closed.
2. Old active Reporting Lines are closed.
3. Subordinates that reported to the old assignment are recreated against the
   Employee's new assignment.
4. Primary Manager can be selected for the new assignment.
5. Existing DOTTED managers are carried when still active.
6. Cycle Detection protects the new graph.
7. Legacy `employees.manager_employee_id`, `position_id`,
   `primary_business_unit_id` and `job_level` are synchronized for temporary
   compatibility only.

## Permissions

- employee.master.view
- employee.master.manage
- employee.organization_assignment.view
- employee.organization_assignment.manage

Granted to HR_EMPLOYEE_ADMIN and SUPER_ADMIN.

## Audit

Transition writes:

`EMPLOYEE_ASSIGNMENT.TRANSITIONED`

with previous assignment, next assignment, manager and reporting continuity
metadata.

## UI

Employee Master includes an Organization action for each Employee.

Route:

`/employee/:id/organization-assignment`

## Current limitation

Future-dated assignment scheduling is intentionally not enabled yet. Effective
Date must be today or earlier so an Assignment cannot remain FUTURE forever
without a scheduler.

Department remains HOLD.

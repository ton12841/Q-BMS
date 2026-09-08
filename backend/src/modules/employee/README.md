# Module / Employee

Status: FOUNDATION ACTIVE

Employee is a Shared Module and the source of truth for Employee master/profile/employment-linked data.

Implemented:
- Employee Master create/edit/list
- Employee Assignment to Business Unit + Position + Job Grade
- Self-Onboarding profile data
- Canonical Onboarding State Resolver
- Employee Workspace foundation

Business tools such as HRM must call Employee services instead of importing Employee repositories directly.


## v2.3.1.0 — Organization Assignment Management

Active Employee organization changes are versioned in `employee_assignments`.
Employee Master may not overwrite an ACTIVE Employee's Business Unit,
Position or Job Grade.

Dedicated API:

- `GET /api/employees/:employeeId/organization-assignments/overview`
- `POST /api/employees/:employeeId/organization-assignments/transitions`

Assignment transitions preserve Reporting Line continuity and write Audit Log.
Department remains HOLD.

# Q BMS v2.0.13.0 — New Employee Pre-Registration

## Purpose
Make **New Employee** the permanent HR entry flow while keeping **Existing Employee Import** outside the daily HR workflow as an Initial Migration utility.

## Permanent onboarding flow

```text
HR Create New Employee
        ↓
Employee = PRE_ONBOARDING
Record Type = NEW_HIRE
Profile = NOT_STARTED
Company Email = NULL
        ↓
Q BMS creates IT Account Setup Request = PENDING
        ↓
IT creates Google Workspace account
        ↓
IT confirms Company Email
        ↓
Invitation
        ↓
Google SSO / First Login
        ↓
Employee completes personal profile
        ↓
HR Review
        ↓
Employee ACTIVE
```

## Workflow-owned fields
The Employee Master create/edit form does **not** directly control:
- Company Email
- Employee lifecycle status
- Record Type
- Profile Status
- IT Account Setup status
- Invitation status
- Q BMS User account status

These fields change through their dedicated workflow actions.

## Create transaction
`POST /api/employees` now creates both:
1. Employee with `PRE_ONBOARDING`, `NEW_HIRE`, `NOT_STARTED`, no Company Email.
2. Primary Employee Assignment.
3. One open `employee_account_setup_requests` row with `PENDING` status.

All three happen in one database transaction.

## Existing Employee
Existing Employee bulk upload remains reserved as an **Initial Employee Migration Utility**. It is not exposed as the primary action in Employee Master.

## Department
Department remains reserved in the schema and stays on HOLD.

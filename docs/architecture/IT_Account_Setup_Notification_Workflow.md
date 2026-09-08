# Q BMS v2.0.14.0 — IT Account Setup + Notification Workflow

## Purpose
New Employee onboarding must not depend on HR knowing the Company Email before IT creates the Google Workspace account.

## Workflow
1. HR creates a New Employee.
2. Q BMS creates `employee_account_setup_requests` with `PENDING` status in the same transaction.
3. Q BMS emits `IT_ACCOUNT_SETUP_REQUESTED` to the Notification module.
4. Notification targets are created for role `IT_ACCOUNT_ADMIN` on `IN_APP` and `EMAIL` channels.
5. IT sees the request in the Account Setup Queue and changes it to `IN_PROGRESS`.
6. IT creates the Google Workspace account outside Q BMS in this phase.
7. IT confirms the Company Email in Q BMS.
8. Q BMS updates `employees.company_email`, completes the request and prepares a `DRAFT` employee invitation.
9. Q BMS emits `IT_ACCOUNT_READY` to role `HR_EMPLOYEE_ADMIN`.
10. The later Invitation workflow sends the onboarding invitation to the employee.

## Notification boundary
Employee and Account Setup workflows emit events only. They do not contain Gmail-specific send logic.

`notification_events` stores the business event. `notification_targets` stores intended delivery channels and audiences. Role-targeted EMAIL deliveries remain `WAITING_RECIPIENT` until Google Workspace mail routing/delivery is connected. This prevents fake email success while keeping the workflow event fully traceable.

## Permissions
- `employee.account_setup.manage` → system role `IT_ACCOUNT_ADMIN`
- `employee.onboarding.manage` → system role `HR_EMPLOYEE_ADMIN`

No user is auto-assigned to either role. Authentication and role assignment will bind real users later.

## Company Email rule
Account Setup completion validates the configured `COMPANY_EMAIL_DOMAIN`. Development defaults to `iquritech.com`.

## Department
Department remains reserved/HOLD and is not introduced by this workflow.

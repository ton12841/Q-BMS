# Q BMS v2.0.16.0 — HR Invitation Management Foundation

## Purpose

This phase adds the HR-owned handoff that starts after IT Admin confirms a New Employee's Company Email.

Permanent onboarding flow:

```text
HR creates New Employee
        ↓
IT Admin receives Account Setup request
        ↓
IT creates Google Workspace account
        ↓
IT confirms Company Email
        ↓
HRM / Employee Invitations
        ↓
HR queues Q BMS invitation
        ↓
Notification Outbox / Email Delivery
        ↓
Google SSO (next phase)
        ↓
Employee completes profile
```

## Ownership

- **Employee Module** owns Employee master data and Company Email value.
- **IT Admin Tool** owns operational Google Workspace account setup.
- **HRM Tool** owns onboarding invitation decisions.
- **Notification Module** owns delivery targets/outbox records.
- **Authentication/Core Auth** will own Google SSO in the next phase.

The HRM workflow must not send Gmail directly from HRM code.

## Invitation lifecycle

The invitation lifecycle is now:

```text
DRAFT → QUEUED → SENT → ACCEPTED
                    ↘ EXPIRED
DRAFT / QUEUED / SENT → REVOKED
```

`QUEUED` is intentionally separate from `SENT`. A queued email is not considered sent until a future Google Workspace mail transport confirms delivery.

## Public invitation ID

Each invitation receives a database-generated `public_id` UUID. It can later be used in an activation URL such as:

```text
/activate?invite=<public_id>
```

This public identifier is not sufficient to activate an account. The activation flow will additionally require Google Workspace authentication and Company Email matching.

## API

```text
GET  /api/hrm/invitations?lang=en|th|lo
POST /api/hrm/invitations/:employeeId/queue?lang=...
POST /api/hrm/invitations/:employeeId/revoke?lang=...
```

## UI

```text
/hrm
/hrm/invitations
```

The HRM card in Modules & Tools now opens the HRM Dashboard.

## Security / permission direction

Migration 009 adds:

```text
employee.invitation.manage
```

and assigns it to the existing system role:

```text
HR_EMPLOYEE_ADMIN
```

Actual route enforcement will be activated with the authentication/permission runtime. This patch does not fake an authenticated user during local development.

## Email delivery boundary

Queue Invitation creates a direct EMAIL target in `notification_targets` with the employee's confirmed Company Email. It remains `PENDING` until a delivery worker/provider sends it.

No UI should claim that a queued invitation was sent.

## Department

Department remains reserved/HOLD and is not part of invitation eligibility or permission logic.

# Q BMS — New Employee Onboarding Foundation

Version: **v2.0.12.0**

## Permanent New Employee Flow

```text
HR Create Pre-Employee
        ↓
IT Google Workspace Account Setup
        ↓
IT confirms Company Email
        ↓
HR Send Invitation
        ↓
Employee Sign in with Google
        ↓
Employee completes Personal Profile
        ↓
Employee submits profile
        ↓
HR Review
        ↓
Employee ACTIVE / Q BMS User ACTIVE
```

## Existing Employees

Existing employees are handled as an **Initial Employee Migration** concern, not the permanent HR onboarding flow. The migration/import utility can be enabled for implementation, acquisition, bulk migration, or controlled admin recovery, then hidden from normal HR operations.

## Identity Boundaries

- **Employee** = person/employment record.
- **Google Workspace Account** = company identity created/managed by IT.
- **Q BMS User** = application access identity bound to the Employee after successful Google authentication.
- **Invitation** = onboarding authorization; it is not a password and does not create the Google account.

## Company Email

`employees.company_email` is nullable during Pre-Onboarding because HR creates the Employee before IT creates the Workspace account. Once IT completes the account setup request, the confirmed Company Email is written to the Employee record.

## Workflow Tables

### employee_account_setup_requests
Tracks the IT handoff and Workspace account creation. Only one PENDING/IN_PROGRESS request can exist per employee at a time.

### employee_invitations
Tracks Q BMS onboarding invitations. Only one DRAFT/SENT invitation can exist per employee at a time. Future invitation tokens must be stored only as hashes.

## Profile Status

`employees.profile_status` is independent from employment status:

- `NOT_STARTED`
- `IN_PROGRESS`
- `SUBMITTED`
- `COMPLETE`

This avoids overloading `employee_status` with profile-completion state.

## Department

Department remains **HOLD**. No Department workflow is introduced by this foundation.

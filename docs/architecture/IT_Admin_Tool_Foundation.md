# Q BMS v2.0.15.0 — IT Admin Tool Foundation

## Decision
`IT Admin` is a Q BMS **Tool**, not a Department and not a shared master-data Module.

The Tool represents IT operational capabilities. Access must be granted by Role / Permission (for example `IT_ACCOUNT_ADMIN`) rather than by checking whether an employee belongs to an IT Department.

Department remains independent and continues to stay on HOLD in the current Organization scope.

## Platform placement

```text
Q BMS Platform
├── Modules
│   ├── Employee
│   ├── Organization
│   ├── Asset
│   ├── Notification
│   └── ...
│
└── Tools
    ├── HRM
    ├── IT Admin
    ├── Inventory
    ├── Procurement
    ├── Installation
    ├── Financial
    └── ...
```

## IT Admin workspaces

### Available now
- Account Setup
  - New Employee account setup queue
  - Start Google Workspace account setup
  - Confirm Company Email
  - Complete the setup request
  - Create Invitation Draft
  - Notify HR through the notification workflow

### Reserved for later
- Access Management
- IT Requests
- Device Assignment

Device Assignment must consume the shared Asset Module rather than creating a separate device master inside IT Admin.

## New Employee handoff

```text
HR / Employee Module
Create New Employee
       ↓
Create employee_account_setup_request
       ↓
IT_ACCOUNT_SETUP_REQUESTED
       ↓
IT Admin / Account Setup
       ↓
IT creates Google Workspace Account
       ↓
Confirm Company Email
       ↓
IT_ACCOUNT_READY
       ↓
HR continues Invitation / Onboarding
```

The Employee Module owns employee data. IT Admin owns the operational work of creating and administering the company account.

## URLs

Primary Tool URLs:

```text
/it-admin
/it-admin/account-setup
```

The previous frontend URL `/employee/account-setup` now redirects to `/it-admin/account-setup` for compatibility.

## API ownership

Primary API:

```text
GET   /api/it-admin/account-setup
PATCH /api/it-admin/account-setup/:id/start
PATCH /api/it-admin/account-setup/:id/complete
```

The previous `/api/employee-account-setup` endpoint is retained as a temporary compatibility alias in this version. New code must use the IT Admin API.

The implementation now lives under:

```text
backend/src/modules/it-admin/account-setup/
frontend/src/modules/it-admin/account-setup/
```

Compatibility re-export files remain under the previous Employee account-setup source path so old imports do not create a second implementation.

## Permission principle

Current foundation permission / system role from migration 008:

```text
Permission: employee.account_setup.manage
Role:       IT_ACCOUNT_ADMIN
```

The permission code is preserved for database compatibility in this version. A future permission-normalization migration may rename it to an `it_admin.*` namespace when the authorization layer is implemented end-to-end.

The key architecture rule remains:

> Capability grants access. Department does not grant capability.

## No database change

v2.0.15.0 is an application-architecture and UI routing patch. Migration 008 remains the current database foundation for IT Account Setup and Notifications.

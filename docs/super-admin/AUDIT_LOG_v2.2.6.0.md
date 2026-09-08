# Q BMS v2.2.6.0 — Audit Log Foundation

## Purpose

Turns the existing Core `audit_logs` table into a usable Super Admin governance tool.

## Read-only capabilities

- Latest audit events
- Actor / Employee / email
- Action code
- Entity type / ID
- Timestamp
- Sanitized metadata
- Search
- Action filter
- Entity Type filter
- Actor filter
- Pagination

## Security

Metadata is sanitized in the Backend before being returned to the browser.

Keys matching sensitive patterns such as:
- password
- secret
- token
- authorization
- cookie
- session id
- private key
- API key
- OTP / verification code

are replaced with `[REDACTED]`.

## Route

`/super-admin/audit-log`

## Permission

`system.audit_log.view`

Granted to `SUPER_ADMIN`.

Development Preview continues to work through the existing local development permission behavior.

## Scope

Read-only foundation. Audit records are not editable or deletable from this UI.

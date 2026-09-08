# Q BMS v2.2.4.0 — Super Admin Hub

## What changes

Super Admin becomes a first-class Q BMS Tool instead of requiring a direct URL.

### Sidebar
A **Super Admin** navigation item is shown only when:

- the current user has `SUPER_ADMIN`, or
- the session is `DEVELOPMENT_PREVIEW` in local development.

Normal employees do not see this entry.

### Super Admin Hub
New route:

`/super-admin`

Ready capabilities:
- Access Control
- Effective Permission Preview
- Level / Grade Policy

Reserved capabilities are displayed as planned but are intentionally not clickable:
- User & Identity Management
- System Configuration
- Audit Log

This avoids pretending unfinished workflows are implemented.

## Access rule

The Hub itself is client-guarded:
- Development Preview → allowed
- `SUPER_ADMIN` → allowed
- all other sessions → redirect to normal Q BMS workspace

Backend Access Control APIs remain protected by their existing permission middleware.

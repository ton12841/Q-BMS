# Q BMS v2.0.18.0 — Authentication Routing + Session Foundation

## Purpose

Connect the single Q BMS login page to the protected workspace without introducing a second Super Admin login or hard-coding any employee email.

## Core model

- One login entry: `/login`
- Google Workspace SSO is the intended production identity provider.
- Employee identity and system roles remain separate concerns.
- `SUPER_ADMIN` is a system role, not a Position / Grade / Level.
- Session tokens are stored only in an HttpOnly browser cookie.
- PostgreSQL stores only a SHA-256 hash of the session token.

## Routing behavior

```text
No workspace session
  -> protected Q BMS route
  -> /login

Workspace session exists
  -> /login
  -> /

Sign out
  -> revoke server session
  -> clear cookie
  -> /login
```

`/login` and the reserved `/activate/...` invitation path are public.

## Development preview

Google SSO credentials are not configured yet. For localhost only, Q BMS exposes a development workspace session so UI/API development can continue while the production identity flow is built.

Development preview:

- is unavailable when `NODE_ENV=production`
- is not attached to an Employee or User
- has no roles or permissions
- is clearly labelled in the shell
- uses the same session cookie / revocation path as the future real user session

It is not a fake Employee login.

## Next authentication phase

Google Workspace SSO will replace the development entry path by creating a `USER` session only after Google identity, invitation/account status and Q BMS user mapping are validated.

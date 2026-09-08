# Q BMS v2.1.0 — Single Login + Google Workspace SSO

## Locked model

Q BMS has one login entry point. Employees, managers, admins and Super Admins all authenticate with the company Google Workspace account.

Organizational identity and system access are separate:

```text
Employee Assignment
├── Business Unit
├── Position
├── Job Grade
└── Job Level

Q BMS User
└── System Roles / Permissions
    ├── HR_EMPLOYEE_ADMIN
    ├── IT_ACCOUNT_ADMIN
    └── SUPER_ADMIN
```

`SUPER_ADMIN` is a special system role. It does not imply a Position, Grade, Level, Department, manager relationship or workflow approver relationship.

## Standard sign-in

```text
/login
  -> Sign in with Google
  -> Google OAuth 2.0 + OpenID Connect
  -> enforce configured Workspace domain
  -> match existing Q BMS Google subject
  -> load Employee + Roles + Permissions
  -> create hashed Q BMS session
  -> Q BMS workspace
```

## First invitation activation

```text
HR Invitation
  -> /activate/{invitation-public-id}
  -> verify invitation is active and not expired
  -> Sign in with Google
  -> Google email must equal invited Company Email
  -> bind Google subject to Employee/User
  -> mark Invitation ACCEPTED
  -> create Q BMS session
  -> First Sign-in / Employee Profile checkpoint
```

The invitation URL is an identifier, not a password. Possession of the URL alone cannot activate an account because Google Workspace identity must also match the invited company email.

## Security decisions

- No employee email is hard-coded in source code.
- OAuth uses a random state value stored as a SHA-256 hash in PostgreSQL.
- OAuth state is bound to an HttpOnly SameSite cookie.
- PKCE S256 is used for the Google authorization-code flow.
- Google access and refresh tokens are not stored by Q BMS.
- Q BMS stores Google's stable `sub` identifier after successful activation.
- Q BMS session tokens are random and only their SHA-256 hashes are stored in PostgreSQL.
- Super Admin is assigned through `user_roles`; no first Super Admin is auto-created or hard-coded.
- Local Development Preview remains available only outside production.

## Deployment configuration

Backend environment values required for live Google SSO:

```text
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
GOOGLE_WORKSPACE_DOMAIN=iquritech.com
```

Google Cloud OAuth must register the exact redirect URI used by the backend.

## Not included in this bundle

Personal-information field design is intentionally not invented inside Authentication. After first sign-in, the user reaches the Employee Profile checkpoint. The actual personal-data form belongs to the Employee / HRM domain once its required fields are agreed.

External Gmail delivery of queued invitation notifications is also a separate Notification transport concern; invitation generation and activation links are ready for that transport.

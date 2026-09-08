# Google Workspace SSO — v2.1.1.0

Q BMS uses one login for all employees and system administrators.

```text
Q BMS Login
   ↓
Google Workspace OAuth 2.0 (Authorization Code + PKCE)
   ↓
Q BMS Backend Callback
   ↓
Verified Google identity + company domain validation
   ↓
Invitation activation OR existing linked Q BMS user
   ↓
Secure server session
   ↓
Employee profile + roles + permissions
   ↓
Workspace / onboarding route
```

`SUPER_ADMIN` is loaded through Q BMS system roles. It does not derive from organization Position, Grade, Job Level or reporting hierarchy.

The backend owns the OAuth Client Secret. The frontend never receives it.

# Q BMS Single Login UI Foundation — v2.0.17.0

## Decision
Q BMS uses one employee-facing sign-in entry point. There is no separate Super Admin login screen.

- Authentication provider: Google Workspace SSO (connection follows in the authentication phase).
- Employee identity and organization assignment remain separate from system access roles.
- `SUPER_ADMIN` is a special system role/permission set, not a Position, Job Grade or Job Level.
- A user may be an Employee and also hold one or more system roles such as `SUPER_ADMIN`, `HR_ADMIN` or `IT_ADMIN`.

## UI route
- `/login`

The current patch is UI foundation only. Clicking **Sign in with Google** intentionally does not fake authentication; it displays a notice that Google Workspace SSO wiring is pending.

## Future authentication flow
1. User opens Q BMS login.
2. User authenticates with Google Workspace.
3. Q BMS resolves the linked User/Employee identity.
4. Q BMS loads roles and permissions.
5. Active users enter the authorized workspace.
6. Invitation activation will use the same Google identity flow.

## Compatibility
The existing development landing page remains unchanged in this patch so current module development is not blocked before route protection and real SSO are implemented.

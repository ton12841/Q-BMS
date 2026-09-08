# Q BMS Authentication

Single sign-in architecture:

- Employees, managers, admins and Super Admins use the same Google Workspace login.
- Organizational identity (Business Unit / Position / Grade / Level) comes from Employee Assignment.
- System access comes from User Roles and Permissions.
- `SUPER_ADMIN` is a special system role and is not tied to Job Level, Job Grade, Position or Department.
- First activation requires an active HR invitation whose company email matches the verified Google account.
- Google access/refresh tokens are not stored. Q BMS stores only the Google subject identifier and its own hashed session token.
- Local development can use a Development Preview session when `NODE_ENV` is not production.

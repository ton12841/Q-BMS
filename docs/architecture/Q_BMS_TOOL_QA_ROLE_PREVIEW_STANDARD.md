# Q BMS Tool QA Role Preview Standard

Every Q BMS Tool should support Development/QA role preview when role-based experiences need to be tested.

Rules:
1. Never create separate tools for each job role.
2. Preview the same Tool and data model with a synthetic presentation context.
3. Never persist the synthetic role or scope to Employee, BMS Access, or Tool Membership.
4. Read-scope expansion is allowed only in Development/QA.
5. Write operations always remain protected by the authenticated user's real permissions.
6. Production must derive experience from real Role + Permission + Data Scope + Business Unit Context.
7. QA preview controls must not render in production builds.

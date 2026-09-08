BEGIN;

ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS role_category VARCHAR(40) NOT NULL DEFAULT 'CUSTOM',
    ADD COLUMN IF NOT EXISTS is_assignable BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 500;

INSERT INTO roles (
    code,
    name,
    description,
    is_system_role,
    status,
    role_category,
    is_assignable,
    sort_order
)
VALUES
    (
        'EMPLOYEE',
        'Employee',
        'Canonical base role for every employee Q BMS user.',
        TRUE,
        'ACTIVE',
        'BASE',
        TRUE,
        10
    ),
    (
        'HR_EMPLOYEE_ADMIN',
        'HR Admin',
        'Administration role for employee lifecycle, onboarding, invitation and HR workflow.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        100
    ),
    (
        'IT_ACCOUNT_ADMIN',
        'IT Admin',
        'Administration role for company account setup and IT administration workflow.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        110
    ),
    (
        'INVENTORY_ADMIN',
        'Inventory Admin',
        'Administration role for Inventory Management.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        120
    ),
    (
        'PROCUREMENT_ADMIN',
        'Procurement Admin',
        'Administration role for Procurement Management.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        130
    ),
    (
        'FINANCE_ADMIN',
        'Finance Admin',
        'Administration role for Financial Management.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        140
    ),
    (
        'INSTALLATION_ADMIN',
        'Installation Admin',
        'Administration role for Installation Management.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        150
    ),
    (
        'MANAGEMENT_ADMIN',
        'Management Admin',
        'Administration role for management reporting and enterprise dashboards.',
        TRUE,
        'ACTIVE',
        'ADMIN',
        TRUE,
        160
    ),
    (
        'SUPER_ADMIN',
        'Super Admin',
        'Special Q BMS system administration role independent from Position, Grade and Level.',
        TRUE,
        'ACTIVE',
        'SYSTEM',
        TRUE,
        900
    )
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_role = EXCLUDED.is_system_role,
    status = EXCLUDED.status,
    role_category = EXCLUDED.role_category,
    is_assignable = EXCLUDED.is_assignable,
    sort_order = EXCLUDED.sort_order;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('employee.workspace.access', 'Access Employee Workspace', 'Access the employee self-service workspace.', 'Employee Workspace'),
    ('employee.profile.self.view', 'View Own Profile', 'View the current employee profile.', 'Employee Workspace'),
    ('employee.profile.self.edit', 'Edit Own Profile', 'Edit employee-owned profile fields when workflow allows.', 'Employee Workspace'),
    ('employee.employment.self.view', 'View Own Employment', 'View own employment assignment and organization data.', 'Employee Workspace'),
    ('employee.documents.self.view', 'View Own Documents', 'View documents belonging to the current employee.', 'Employee Workspace'),
    ('employee.assets.self.view', 'View Own Assets', 'View assets assigned to the current employee.', 'Employee Workspace'),
    ('organization.directory.view', 'View Organization Directory', 'Read shared organization directory information.', 'Organization'),

    ('employee.master.manage', 'Manage Employee Master', 'Create and maintain Employee Master data.', 'HRM'),
    ('tool.hrm.access', 'Access HRM', 'Access Human Resource Management administration tools.', 'Tools'),
    ('tool.it_admin.access', 'Access IT Admin', 'Access IT administration tools.', 'Tools'),
    ('tool.inventory.access', 'Access Inventory Management', 'Access Inventory Management administration tools.', 'Tools'),
    ('tool.procurement.access', 'Access Procurement Management', 'Access Procurement Management administration tools.', 'Tools'),
    ('tool.finance.access', 'Access Financial Management', 'Access Financial Management administration tools.', 'Tools'),
    ('tool.installation.access', 'Access Installation Management', 'Access Installation Management administration tools.', 'Tools'),
    ('tool.management.access', 'Access Management Dashboard', 'Access enterprise management dashboards and reporting.', 'Tools'),

    ('system.access_control.view', 'View Access Control', 'View Q BMS roles, permissions and user-role assignments.', 'System'),
    ('system.access_control.manage', 'Manage Access Control', 'Assign and remove Q BMS system roles from users.', 'System'),
    ('system.super_admin', 'Super Admin Capability', 'Marks the special Q BMS Super Admin capability.', 'System')
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

-- Canonical Employee base role.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(ARRAY[
    'employee.workspace.access',
    'employee.profile.self.view',
    'employee.profile.self.edit',
    'employee.employment.self.view',
    'employee.documents.self.view',
    'employee.assets.self.view',
    'organization.directory.view'
])
WHERE r.code = 'EMPLOYEE'
ON CONFLICT DO NOTHING;

-- HR Admin keeps the already-established onboarding permissions and receives
-- the canonical HR tool / employee master capabilities.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(ARRAY[
    'tool.hrm.access',
    'employee.master.manage',
    'employee.onboarding.manage',
    'employee.invitation.manage'
])
WHERE r.code = 'HR_EMPLOYEE_ADMIN'
ON CONFLICT DO NOTHING;

-- IT Admin keeps the existing account-setup permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(ARRAY[
    'tool.it_admin.access',
    'employee.account_setup.manage'
])
WHERE r.code = 'IT_ACCOUNT_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'tool.inventory.access'
WHERE r.code = 'INVENTORY_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'tool.procurement.access'
WHERE r.code = 'PROCUREMENT_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'tool.finance.access'
WHERE r.code = 'FINANCE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'tool.installation.access'
WHERE r.code = 'INSTALLATION_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'tool.management.access'
WHERE r.code = 'MANAGEMENT_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(ARRAY[
    'system.access_control.view',
    'system.access_control.manage',
    'system.super_admin'
])
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

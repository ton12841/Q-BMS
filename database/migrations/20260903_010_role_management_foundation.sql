BEGIN;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'system.role_management.view',
    'View Role Management',
    'View Q BMS Role definitions and their Permission membership.',
    'System'
  ),
  (
    'system.role_management.manage',
    'Manage Roles',
    'Create Custom Admin Roles and maintain allowed Role permission membership.',
    'System'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = ANY(ARRAY[
  'system.role_management.view',
  'system.role_management.manage'
])
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

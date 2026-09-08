BEGIN;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'system.user_identity.view',
    'View User & Identity Management',
    'View Q BMS user accounts, Employee links, Google identity state, sessions and roles.',
    'System'
  ),
  (
    'system.user_identity.manage',
    'Manage User & Identity',
    'Reserved capability for future controlled user and identity administration actions.',
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
  'system.user_identity.view',
  'system.user_identity.manage'
])
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

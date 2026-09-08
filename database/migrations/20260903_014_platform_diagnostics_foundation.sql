BEGIN;

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
  'system.platform_diagnostics.view',
  'View Platform Diagnostics',
  'View read-only Q BMS platform health and integrity diagnostics.',
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
JOIN permissions p ON p.code = 'system.platform_diagnostics.view'
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

BEGIN;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'system.audit_log.view',
    'View Audit Log',
    'View Q BMS audit activity, actors, affected entities and sanitized metadata.',
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
JOIN permissions p ON p.code = 'system.audit_log.view'
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

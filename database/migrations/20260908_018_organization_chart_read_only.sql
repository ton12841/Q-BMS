BEGIN;

-- Q BMS v2.3.2.0
-- Organization Chart + Employee Read-Only Organization View

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
  'organization.chart.view',
  'View Organization Chart',
  'View the auto-generated organization chart from current Employee Organization Assignments and Reporting Lines.',
  'Organization'
)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

-- Every Employee can view the chart. HR / Super Admin receive it explicitly too.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'organization.chart.view'
WHERE r.code IN ('EMPLOYEE', 'HR_EMPLOYEE_ADMIN', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

UPDATE permissions
SET level_grade_policy_eligible = FALSE
WHERE code = 'organization.chart.view';

COMMIT;

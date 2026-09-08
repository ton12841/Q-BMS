BEGIN;

-- Q BMS v2.3.0.0
-- Reporting Lines Management
--
-- Reporting Lines are Employee Assignment -> Employee Assignment relations.
-- Manager is never inferred from Job Grade alone.

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'organization.reporting_lines.view',
    'View Reporting Lines',
    'View employee reporting relationships, active managers and reporting history.',
    'Organization'
  ),
  (
    'organization.reporting_lines.manage',
    'Manage Reporting Lines',
    'Create, change and end employee PRIMARY / DOTTED reporting relationships.',
    'Organization'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

-- Reporting-line administration is an HR responsibility. SUPER_ADMIN receives
-- the same canonical permissions for governance / support.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'organization.reporting_lines.view',
  'organization.reporting_lines.manage'
)
WHERE r.code IN ('HR_EMPLOYEE_ADMIN', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- These are administration capabilities, not employee Level / Grade policy.
UPDATE permissions
SET level_grade_policy_eligible = FALSE
WHERE code IN (
  'organization.reporting_lines.view',
  'organization.reporting_lines.manage'
);

-- Existing schema already guarantees one current PRIMARY relation. Add a
-- current pair guard so the same Employee Assignment -> Manager relationship
-- cannot be duplicated as multiple open rows with different effective dates.
DO $$
DECLARE
  duplicate_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT
      employee_assignment_id,
      reports_to_assignment_id,
      relationship_type,
      COUNT(*)
    FROM employee_reporting_lines
    WHERE status = 'ACTIVE'
      AND effective_to IS NULL
    GROUP BY
      employee_assignment_id,
      reports_to_assignment_id,
      relationship_type
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION
      'Reporting Lines preflight: % duplicate current reporting pair(s) found. No data changed.',
      duplicate_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_current_reporting_pair
  ON employee_reporting_lines (
    employee_assignment_id,
    reports_to_assignment_id,
    relationship_type
  )
  WHERE status = 'ACTIVE' AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_employee_reporting_lines_effective_dates
  ON employee_reporting_lines (effective_from, effective_to);

COMMENT ON TABLE employee_reporting_lines IS
  'Canonical Employee Assignment reporting relationships. Supports PRIMARY and DOTTED lines, effective dates and history. Reporting Line management became active in Q BMS v2.3.0.0.';

COMMIT;

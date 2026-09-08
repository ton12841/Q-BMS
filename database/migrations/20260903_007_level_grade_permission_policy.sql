BEGIN;

ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS level_grade_policy_eligible BOOLEAN NOT NULL DEFAULT FALSE;

-- Employee Workspace capabilities planned in the canonical Employee Workspace.
-- These are permission definitions only. No Level or Grade is granted them automatically.
INSERT INTO permissions (code, name, description, permission_group, level_grade_policy_eligible)
VALUES
  ('employee.attendance.self.view', 'View Own Attendance', 'View attendance records belonging to the current employee.', 'Employee Workspace', TRUE),
  ('employee.leave.self.view', 'View Own Leave', 'View leave requests and balances belonging to the current employee.', 'Employee Workspace', TRUE),
  ('employee.kpi.self.view', 'View Own KPI & Performance', 'View KPI and performance information belonging to the current employee.', 'Employee Workspace', TRUE),
  ('employee.tasks.self.view', 'View Own Tasks', 'View tasks assigned to the current employee.', 'Employee Workspace', TRUE),
  ('employee.requests.self.view', 'View Own Requests', 'View requests raised by the current employee.', 'Employee Workspace', TRUE),
  ('employee.notifications.self.view', 'View Own Notifications', 'View notifications addressed to the current employee.', 'Employee Workspace', TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group,
  level_grade_policy_eligible = TRUE;

-- Existing Employee / Organization capabilities are eligible for the policy engine.
UPDATE permissions
SET level_grade_policy_eligible = TRUE
WHERE code IN (
  'employee.workspace.access',
  'employee.profile.self.view',
  'employee.profile.self.edit',
  'employee.employment.self.view',
  'employee.documents.self.view',
  'employee.assets.self.view',
  'organization.directory.view'
);

CREATE TABLE IF NOT EXISTS job_level_permission_grants (
  job_level_id BIGINT NOT NULL REFERENCES job_levels(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_level_id, permission_id)
);

CREATE TABLE IF NOT EXISTS job_grade_permission_overrides (
  job_grade_id BIGINT NOT NULL REFERENCES job_grades(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  override_effect VARCHAR(20) NOT NULL
    CHECK (override_effect IN ('GRANT', 'REVOKE')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_grade_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_job_level_permission_grants_permission
  ON job_level_permission_grants(permission_id);

CREATE INDEX IF NOT EXISTS idx_job_grade_permission_overrides_permission
  ON job_grade_permission_overrides(permission_id);

COMMIT;

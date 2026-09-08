BEGIN;

-- Q BMS v2.3.1.0
-- Employee Organization Assignment Management
--
-- Employee Assignment is the canonical employment/organization history:
-- Employee + Business Unit + Position + Job Grade.
-- Job Level is derived from Job Grade.
-- Reporting Lines remain Employee Assignment -> Employee Assignment.

ALTER TABLE employee_assignments
  ADD COLUMN IF NOT EXISTS change_type VARCHAR(30),
  ADD COLUMN IF NOT EXISTS change_reason TEXT,
  ADD COLUMN IF NOT EXISTS change_note TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

UPDATE employee_assignments
SET change_type = 'LEGACY'
WHERE change_type IS NULL;

ALTER TABLE employee_assignments
  ALTER COLUMN change_type SET DEFAULT 'LEGACY',
  ALTER COLUMN change_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_employee_assignment_change_type'
  ) THEN
    ALTER TABLE employee_assignments
      ADD CONSTRAINT chk_employee_assignment_change_type
      CHECK (
        change_type IN (
          'LEGACY',
          'INITIAL',
          'TRANSFER',
          'PROMOTION',
          'LATERAL_MOVE',
          'CORRECTION'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_employee_assignment_created_by_user'
  ) THEN
    ALTER TABLE employee_assignments
      ADD CONSTRAINT fk_employee_assignment_created_by_user
      FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_effective
  ON employee_assignments (
    employee_id,
    effective_from DESC,
    id DESC
  );

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'employee.master.view',
    'View Employee Master',
    'View Employee Master records and current organization assignment.',
    'Employee'
  ),
  (
    'employee.master.manage',
    'Manage Employee Master',
    'Create and update Employee Master records. Active organization moves are managed through Assignment Management.',
    'Employee'
  ),
  (
    'employee.organization_assignment.view',
    'View Employee Organization Assignment',
    'View current and historical Employee Business Unit, Position, Job Grade, Job Level and Manager assignment.',
    'Employee'
  ),
  (
    'employee.organization_assignment.manage',
    'Manage Employee Organization Assignment',
    'Create controlled Employee organization transitions with assignment history and reporting-line continuity.',
    'Employee'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'employee.master.view',
  'employee.master.manage',
  'employee.organization_assignment.view',
  'employee.organization_assignment.manage'
)
WHERE r.code IN ('HR_EMPLOYEE_ADMIN', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

UPDATE permissions
SET level_grade_policy_eligible = FALSE
WHERE code IN (
  'employee.master.view',
  'employee.master.manage',
  'employee.organization_assignment.view',
  'employee.organization_assignment.manage'
);

COMMENT ON COLUMN employee_assignments.change_type IS
  'Business reason category for the assignment record. INITIAL/TRANSFER/PROMOTION/LATERAL_MOVE/CORRECTION. LEGACY is used for records created before v2.3.1.0.';

COMMENT ON COLUMN employee_assignments.created_by_user_id IS
  'Q BMS User that created the assignment transition.';

COMMIT;

BEGIN;

-- Q BMS v2.2.14.0
-- Platform Hardening Baseline
-- Security + data integrity + legacy reporting transition.

-- =========================================================
-- 1) ORGANIZATION ACCESS CONTROL
-- =========================================================

INSERT INTO permissions (code, name, description, permission_group)
VALUES
  (
    'organization.master.view',
    'View Organization Master',
    'View Business Unit, Job Level, Job Grade, Job Family and Position master data.',
    'Organization'
  ),
  (
    'organization.master.manage',
    'Manage Organization Master',
    'Create and update Organization master data such as Job Family and Position.',
    'Organization'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

-- HR needs read access to Organization masters in order to create/edit Employee
-- assignments. Organization master mutation remains explicitly controlled.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'organization.master.view'
WHERE r.code = 'HR_EMPLOYEE_ADMIN'
ON CONFLICT DO NOTHING;

-- Keep the permissions visible in the canonical SUPER_ADMIN role bundle even
-- though SUPER_ADMIN also has platform-level bypass semantics.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'organization.master.view',
  'organization.master.manage'
)
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2) SELF-ONBOARDING / HRM KEY TYPE ALIGNMENT
-- =========================================================
-- employees.id and users.id are BIGSERIAL/BIGINT. Earlier fast-path onboarding
-- migrations used INTEGER in several child tables. Widen them before adding FKs.

ALTER TABLE employee_profile_details
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE employee_emergency_contacts
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE employee_bank_accounts
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE employee_documents
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE employee_policy_acknowledgements
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE onboarding_cases
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE onboarding_tasks
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE onboarding_reviews
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE asset_assignments
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE onboarding_asset_gate_events
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

ALTER TABLE onboarding_activation_events
  ALTER COLUMN employee_id TYPE BIGINT USING employee_id::BIGINT;

-- Product / Location modules are not active yet, so only align future identifiers
-- without inventing cross-module foreign keys.
ALTER TABLE assets
  ALTER COLUMN product_id TYPE BIGINT USING product_id::BIGINT,
  ALTER COLUMN current_location_id TYPE BIGINT USING current_location_id::BIGINT;

-- =========================================================
-- 3) ORPHAN PREFLIGHT
-- =========================================================
-- Fail the migration before adding constraints when existing development data
-- is inconsistent. Nothing is deleted automatically.

DO $$
DECLARE
  orphan_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM employee_profile_details child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: employee_profile_details has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM employee_emergency_contacts child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: employee_emergency_contacts has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM employee_bank_accounts child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: employee_bank_accounts has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM employee_documents child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: employee_documents has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM employee_policy_acknowledgements child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: employee_policy_acknowledgements has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM onboarding_cases child
  LEFT JOIN employees parent ON parent.id = child.employee_id
  WHERE parent.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: onboarding_cases has % orphan employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM onboarding_tasks child
  LEFT JOIN onboarding_cases parent_case ON parent_case.id = child.onboarding_case_id
  LEFT JOIN employees parent_employee ON parent_employee.id = child.employee_id
  WHERE parent_case.id IS NULL OR parent_employee.id IS NULL;
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: onboarding_tasks has % orphan case/employee rows', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM onboarding_reviews child
  LEFT JOIN onboarding_cases parent_case ON parent_case.id = child.onboarding_case_id
  LEFT JOIN employees parent_employee ON parent_employee.id = child.employee_id
  LEFT JOIN users reviewer ON reviewer.id = child.reviewer_user_id
  WHERE parent_case.id IS NULL
     OR parent_employee.id IS NULL
     OR (child.reviewer_user_id IS NOT NULL AND reviewer.id IS NULL);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: onboarding_reviews has % orphan references', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM asset_assignments child
  LEFT JOIN assets asset ON asset.id = child.asset_id
  LEFT JOIN employees employee ON employee.id = child.employee_id
  LEFT JOIN users assigned_by ON assigned_by.id = child.assigned_by_user_id
  LEFT JOIN users returned_by ON returned_by.id = child.returned_by_user_id
  WHERE asset.id IS NULL
     OR employee.id IS NULL
     OR (child.assigned_by_user_id IS NOT NULL AND assigned_by.id IS NULL)
     OR (child.returned_by_user_id IS NOT NULL AND returned_by.id IS NULL);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: asset_assignments has % orphan references', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM onboarding_asset_gate_events child
  LEFT JOIN onboarding_cases parent_case ON parent_case.id = child.onboarding_case_id
  LEFT JOIN employees employee ON employee.id = child.employee_id
  LEFT JOIN assets asset ON asset.id = child.asset_id
  LEFT JOIN asset_assignments assignment ON assignment.id = child.asset_assignment_id
  LEFT JOIN users actor ON actor.id = child.actor_user_id
  WHERE parent_case.id IS NULL
     OR employee.id IS NULL
     OR (child.asset_id IS NOT NULL AND asset.id IS NULL)
     OR (child.asset_assignment_id IS NOT NULL AND assignment.id IS NULL)
     OR (child.actor_user_id IS NOT NULL AND actor.id IS NULL);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: onboarding_asset_gate_events has % orphan references', orphan_count;
  END IF;

  SELECT COUNT(*) INTO orphan_count
  FROM onboarding_activation_events child
  LEFT JOIN onboarding_cases parent_case ON parent_case.id = child.onboarding_case_id
  LEFT JOIN employees employee ON employee.id = child.employee_id
  LEFT JOIN users actor ON actor.id = child.actor_user_id
  WHERE parent_case.id IS NULL
     OR employee.id IS NULL
     OR (child.actor_user_id IS NOT NULL AND actor.id IS NULL);
  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data integrity preflight: onboarding_activation_events has % orphan references', orphan_count;
  END IF;
END $$;

-- =========================================================
-- 4) FOREIGN KEY HARDENING
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_profile_details_employee') THEN
    ALTER TABLE employee_profile_details
      ADD CONSTRAINT fk_employee_profile_details_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_emergency_contacts_employee') THEN
    ALTER TABLE employee_emergency_contacts
      ADD CONSTRAINT fk_employee_emergency_contacts_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_bank_accounts_employee') THEN
    ALTER TABLE employee_bank_accounts
      ADD CONSTRAINT fk_employee_bank_accounts_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_documents_employee') THEN
    ALTER TABLE employee_documents
      ADD CONSTRAINT fk_employee_documents_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_policy_ack_employee') THEN
    ALTER TABLE employee_policy_acknowledgements
      ADD CONSTRAINT fk_employee_policy_ack_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_cases_employee') THEN
    ALTER TABLE onboarding_cases
      ADD CONSTRAINT fk_onboarding_cases_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_tasks_case') THEN
    ALTER TABLE onboarding_tasks
      ADD CONSTRAINT fk_onboarding_tasks_case
      FOREIGN KEY (onboarding_case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_tasks_employee') THEN
    ALTER TABLE onboarding_tasks
      ADD CONSTRAINT fk_onboarding_tasks_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_reviews_case') THEN
    ALTER TABLE onboarding_reviews
      ADD CONSTRAINT fk_onboarding_reviews_case
      FOREIGN KEY (onboarding_case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_reviews_employee') THEN
    ALTER TABLE onboarding_reviews
      ADD CONSTRAINT fk_onboarding_reviews_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_onboarding_reviews_reviewer') THEN
    ALTER TABLE onboarding_reviews
      ADD CONSTRAINT fk_onboarding_reviews_reviewer
      FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_assignments_asset') THEN
    ALTER TABLE asset_assignments
      ADD CONSTRAINT fk_asset_assignments_asset
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_assignments_employee') THEN
    ALTER TABLE asset_assignments
      ADD CONSTRAINT fk_asset_assignments_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_assignments_assigned_by') THEN
    ALTER TABLE asset_assignments
      ADD CONSTRAINT fk_asset_assignments_assigned_by
      FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_assignments_returned_by') THEN
    ALTER TABLE asset_assignments
      ADD CONSTRAINT fk_asset_assignments_returned_by
      FOREIGN KEY (returned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_gate_events_case') THEN
    ALTER TABLE onboarding_asset_gate_events
      ADD CONSTRAINT fk_asset_gate_events_case
      FOREIGN KEY (onboarding_case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_gate_events_employee') THEN
    ALTER TABLE onboarding_asset_gate_events
      ADD CONSTRAINT fk_asset_gate_events_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_gate_events_asset') THEN
    ALTER TABLE onboarding_asset_gate_events
      ADD CONSTRAINT fk_asset_gate_events_asset
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_gate_events_assignment') THEN
    ALTER TABLE onboarding_asset_gate_events
      ADD CONSTRAINT fk_asset_gate_events_assignment
      FOREIGN KEY (asset_assignment_id) REFERENCES asset_assignments(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_asset_gate_events_actor') THEN
    ALTER TABLE onboarding_asset_gate_events
      ADD CONSTRAINT fk_asset_gate_events_actor
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activation_events_case') THEN
    ALTER TABLE onboarding_activation_events
      ADD CONSTRAINT fk_activation_events_case
      FOREIGN KEY (onboarding_case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activation_events_employee') THEN
    ALTER TABLE onboarding_activation_events
      ADD CONSTRAINT fk_activation_events_employee
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activation_events_actor') THEN
    ALTER TABLE onboarding_activation_events
      ADD CONSTRAINT fk_activation_events_actor
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =========================================================
-- 5) LEGACY MANAGER -> REPORTING LINE TRANSITION
-- =========================================================
-- Backfill only when both Employee and Manager have current active primary
-- assignments and the Employee does not already have a current PRIMARY line.

INSERT INTO employee_reporting_lines (
  employee_assignment_id,
  reports_to_assignment_id,
  relationship_type,
  status,
  effective_from
)
SELECT
  employee_assignment.id,
  manager_assignment.id,
  'PRIMARY',
  'ACTIVE',
  COALESCE(employee_assignment.effective_from, CURRENT_DATE)
FROM employees employee
JOIN LATERAL (
  SELECT assignment.*
  FROM employee_assignments assignment
  WHERE assignment.employee_id = employee.id
    AND assignment.is_primary = TRUE
    AND assignment.assignment_status = 'ACTIVE'
    AND assignment.effective_to IS NULL
  ORDER BY assignment.effective_from DESC NULLS LAST, assignment.id DESC
  LIMIT 1
) employee_assignment ON TRUE
JOIN employees manager
  ON manager.id = employee.manager_employee_id
 AND manager.archived_at IS NULL
JOIN LATERAL (
  SELECT assignment.*
  FROM employee_assignments assignment
  WHERE assignment.employee_id = manager.id
    AND assignment.is_primary = TRUE
    AND assignment.assignment_status = 'ACTIVE'
    AND assignment.effective_to IS NULL
  ORDER BY assignment.effective_from DESC NULLS LAST, assignment.id DESC
  LIMIT 1
) manager_assignment ON TRUE
WHERE employee.archived_at IS NULL
  AND employee.manager_employee_id IS NOT NULL
  AND employee.id <> manager.id
  AND NOT EXISTS (
    SELECT 1
    FROM employee_reporting_lines existing
    WHERE existing.employee_assignment_id = employee_assignment.id
      AND existing.relationship_type = 'PRIMARY'
      AND existing.status = 'ACTIVE'
      AND existing.effective_to IS NULL
  )
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN employees.manager_employee_id IS
  'Legacy compatibility only. Runtime manager resolution prefers employee_reporting_lines. Remove only after reporting-line migration is fully complete.';

COMMIT;

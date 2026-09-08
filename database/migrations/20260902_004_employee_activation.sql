BEGIN;

-- HRM-owned activation workflow audit. Employee/User master status remains owned
-- by their respective Core/Employee domains; this table records the workflow event.
CREATE TABLE IF NOT EXISTS onboarding_activation_events (
  id BIGSERIAL PRIMARY KEY,
  onboarding_case_id BIGINT NOT NULL,
  employee_id INTEGER NOT NULL,
  actor_user_id BIGINT NULL,
  event_type VARCHAR(80) NOT NULL,
  note TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_onboarding_activation_employee
  ON onboarding_activation_events(employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_onboarding_activation_case
  ON onboarding_activation_events(onboarding_case_id, created_at DESC);

-- Add the final onboarding workflow task for existing cases. Future cases are
-- created with this task by employee-onboarding.repository.js.
INSERT INTO onboarding_tasks (
  onboarding_case_id, employee_id, task_code, task_name, owner_type, task_status
)
SELECT oc.id, oc.employee_id, 'ACTIVATION', 'Employee Activation', 'HR',
       CASE
         WHEN oc.case_status = 'COMPLETED' THEN 'COMPLETED'
         ELSE 'PENDING'
       END
FROM onboarding_cases oc
WHERE NOT EXISTS (
  SELECT 1
  FROM onboarding_tasks ot
  WHERE ot.employee_id = oc.employee_id
    AND ot.task_code = 'ACTIVATION'
);

UPDATE onboarding_tasks ot
SET completed_at = COALESCE(ot.completed_at, oc.completed_at, NOW()),
    updated_at = NOW()
FROM onboarding_cases oc
WHERE ot.onboarding_case_id = oc.id
  AND ot.task_code = 'ACTIVATION'
  AND ot.task_status = 'COMPLETED'
  AND ot.completed_at IS NULL;

COMMIT;

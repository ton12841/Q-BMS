BEGIN;

-- HRM-owned review history. Employee profile data remains owned by the Employee Module;
-- this table records HR workflow decisions only.
CREATE TABLE IF NOT EXISTS onboarding_reviews (
  id BIGSERIAL PRIMARY KEY,
  onboarding_case_id BIGINT NOT NULL,
  employee_id INTEGER NOT NULL,
  reviewer_user_id BIGINT NULL,
  review_action VARCHAR(40) NOT NULL,
  review_note TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_onboarding_reviews_case
  ON onboarding_reviews(onboarding_case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_onboarding_reviews_employee
  ON onboarding_reviews(employee_id, created_at DESC);

COMMIT;

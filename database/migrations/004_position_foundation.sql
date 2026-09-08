-- Q BMS v2.0.8.0
-- Organization Module: Position foundation
-- Department remains reserved / on HOLD.
-- Position now maps directly to Business Unit + Job Grade.
-- Job Level is derived through Job Grade.

ALTER TABLE positions
  ALTER COLUMN department_id DROP NOT NULL;

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS business_unit_id BIGINT REFERENCES business_units(id);

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS job_grade_id BIGINT REFERENCES job_grades(id);

CREATE INDEX IF NOT EXISTS idx_positions_business_unit_id
  ON positions(business_unit_id);

CREATE INDEX IF NOT EXISTS idx_positions_job_grade_id
  ON positions(job_grade_id);

CREATE INDEX IF NOT EXISTS idx_positions_status
  ON positions(status);

CREATE TABLE IF NOT EXISTS position_translations (
  id BIGSERIAL PRIMARY KEY,
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL CHECK (locale IN ('en', 'th', 'lo')),
  name VARCHAR(180) NOT NULL,
  description TEXT,
  translation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (position_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_position_translations_locale
  ON position_translations(locale);

COMMENT ON COLUMN positions.department_id IS
  'Reserved for the Department module. Nullable while Department is on HOLD.';

COMMENT ON COLUMN positions.job_level IS
  'Legacy field kept for compatibility. New Position structure uses job_grade_id and derives Job Level from Job Grade.';

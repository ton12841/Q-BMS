
-- Q BMS v2.0.9.1
-- Organization Module: Job Family + Multi-Grade Position foundation
--
-- Revised model:
--   Job Family -> Position <-> Job Grade -> Job Level
--
-- Business Unit belongs to the employee/employment assignment context.
-- Department remains reserved / on HOLD.
--
-- Existing v2.0.8.0 columns on positions are preserved for compatibility:
--   business_unit_id  -> legacy / no longer required by the new Position model
--   job_grade_id      -> legacy single-grade mapping
-- Existing job_grade_id values are migrated into position_job_grades.

CREATE TABLE IF NOT EXISTS job_families (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_families_status
  ON job_families(status);

CREATE INDEX IF NOT EXISTS idx_job_families_sort_order
  ON job_families(sort_order);

CREATE TABLE IF NOT EXISTS job_family_translations (
  id BIGSERIAL PRIMARY KEY,
  job_family_id BIGINT NOT NULL REFERENCES job_families(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL CHECK (locale IN ('en', 'th', 'lo')),
  name VARCHAR(180) NOT NULL,
  description TEXT,
  translation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_family_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_job_family_translations_locale
  ON job_family_translations(locale);

ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS job_family_id BIGINT REFERENCES job_families(id);

CREATE INDEX IF NOT EXISTS idx_positions_job_family_id
  ON positions(job_family_id);

CREATE TABLE IF NOT EXISTS position_job_grades (
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  job_grade_id BIGINT NOT NULL REFERENCES job_grades(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (position_id, job_grade_id)
);

CREATE INDEX IF NOT EXISTS idx_position_job_grades_job_grade_id
  ON position_job_grades(job_grade_id);

-- Preserve any single-grade mappings created under v2.0.8.0.
INSERT INTO position_job_grades (
  position_id,
  job_grade_id,
  is_primary,
  sort_order
)
SELECT
  p.id,
  p.job_grade_id,
  TRUE,
  0
FROM positions p
WHERE p.job_grade_id IS NOT NULL
ON CONFLICT (position_id, job_grade_id) DO NOTHING;

COMMENT ON TABLE job_families IS
  'Career/job families such as Sales, Finance, Product, HR, IT. A family groups related job positions.';

COMMENT ON TABLE position_job_grades IS
  'Many-to-many mapping between a Job Position and its allowed Job Grades. Job Level is derived from each Job Grade.';

COMMENT ON COLUMN positions.job_family_id IS
  'Job Family for this Position. Nullable during migration/foundation stage.';

COMMENT ON COLUMN positions.business_unit_id IS
  'Legacy/reserved Position-level Business Unit mapping. New architecture assigns Business Unit in the employee/employment context rather than duplicating Position masters per Business Unit.';

COMMENT ON COLUMN positions.job_grade_id IS
  'Legacy single-grade field from v2.0.8.0. New architecture uses position_job_grades for one or many allowed grades.';

COMMENT ON COLUMN positions.department_id IS
  'Reserved for the Department module. Department remains on HOLD.';

-- Q BMS v2.0.6.0
-- Platform multilingual foundation: EN / TH / LO

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_preferred_language_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_preferred_language_check
      CHECK (preferred_language IN ('en', 'th', 'lo'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS business_unit_translations (
  id BIGSERIAL PRIMARY KEY,
  business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  translation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_unit_id, locale)
);

CREATE TABLE IF NOT EXISTS job_level_translations (
  id BIGSERIAL PRIMARY KEY,
  job_level_id BIGINT NOT NULL REFERENCES job_levels(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  translation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_level_id, locale)
);

CREATE TABLE IF NOT EXISTS job_grade_translations (
  id BIGSERIAL PRIMARY KEY,
  job_grade_id BIGINT NOT NULL REFERENCES job_grades(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(180) NOT NULL,
  experience_requirement VARCHAR(180),
  education_requirement VARCHAR(180),
  description TEXT,
  translation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_grade_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_business_unit_translations_locale
  ON business_unit_translations(locale);
CREATE INDEX IF NOT EXISTS idx_job_level_translations_locale
  ON job_level_translations(locale);
CREATE INDEX IF NOT EXISTS idx_job_grade_translations_locale
  ON job_grade_translations(locale);

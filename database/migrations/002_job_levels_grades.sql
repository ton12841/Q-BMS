-- Q BMS v2.0.5.0
-- Organization Module: Job Level / Grade foundation
-- Department remains reserved / on hold and is not changed in this migration.

CREATE TABLE IF NOT EXISTS job_levels (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_grades (
    id BIGSERIAL PRIMARY KEY,
    job_level_id BIGINT NOT NULL REFERENCES job_levels(id),
    grade_number INTEGER NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    experience_requirement VARCHAR(180),
    education_requirement VARCHAR(180),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_grades_job_level_id
    ON job_grades(job_level_id);

CREATE INDEX IF NOT EXISTS idx_job_grades_status
    ON job_grades(status);

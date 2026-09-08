BEGIN;

-- Employee-owned self profile data. These tables deliberately sit outside HRM
-- workflow ownership so future Employee Workspace screens can reuse them.
CREATE TABLE IF NOT EXISTS employee_profile_details (
  employee_id INTEGER PRIMARY KEY,
  date_of_birth DATE NULL,
  gender VARCHAR(80) NULL,
  nationality VARCHAR(120) NULL,
  national_id VARCHAR(160) NULL,
  mobile VARCHAR(80) NULL,
  personal_email VARCHAR(255) NULL,
  current_address TEXT NULL,
  permanent_address TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  relationship VARCHAR(160) NOT NULL,
  phone VARCHAR(80) NOT NULL,
  alternate_phone VARCHAR(80) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_emergency_primary
  ON employee_emergency_contacts(employee_id)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS employee_bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'LAK',
  bank_branch VARCHAR(255) NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_employee_bank_primary
  ON employee_bank_accounts(employee_id)
  WHERE is_primary = TRUE;

-- Shared Employee/Document foundation. If an earlier employee_documents table
-- exists, add the columns required by the onboarding workflow without deleting
-- or renaming existing columns.
CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  document_type VARCHAR(160) NOT NULL,
  document_url TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED',
  source VARCHAR(40) NOT NULL DEFAULT 'SELF_ONBOARDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(160);
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'SUBMITTED';
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS source VARCHAR(40) DEFAULT 'SELF_ONBOARDING';
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS ix_employee_documents_employee ON employee_documents(employee_id);

CREATE TABLE IF NOT EXISTS employee_policy_acknowledgements (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  policy_code VARCHAR(120) NOT NULL,
  policy_version VARCHAR(80) NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(employee_id, policy_code, policy_version)
);

-- HRM-owned onboarding workflow. Self-onboarding updates employee-owned data,
-- while these rows only track process state / task completion.
CREATE TABLE IF NOT EXISTS onboarding_cases (
  id BIGSERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL UNIQUE,
  case_status VARCHAR(40) NOT NULL DEFAULT 'IN_PROGRESS',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id BIGSERIAL PRIMARY KEY,
  onboarding_case_id BIGINT NOT NULL,
  employee_id INTEGER NOT NULL,
  task_code VARCHAR(120) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  owner_type VARCHAR(40) NOT NULL,
  task_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  completed_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, task_code)
);
CREATE INDEX IF NOT EXISTS ix_onboarding_tasks_case ON onboarding_tasks(onboarding_case_id);
CREATE INDEX IF NOT EXISTS ix_onboarding_tasks_employee ON onboarding_tasks(employee_id);

COMMIT;

BEGIN;

-- Shared Asset Module foundation. HRM references these records but does not own them.
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  asset_code VARCHAR(120) NOT NULL UNIQUE,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(120) NOT NULL,
  product_id INTEGER NULL,
  serial_number VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'AVAILABLE',
  current_location_id INTEGER NULL,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS ix_assets_type ON assets(asset_type);
CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_serial_nonblank
  ON assets ((LOWER(serial_number)))
  WHERE serial_number IS NOT NULL AND BTRIM(serial_number) <> '';

CREATE TABLE IF NOT EXISTS asset_assignments (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT NOT NULL,
  employee_id INTEGER NOT NULL,
  assignment_type VARCHAR(40) NOT NULL DEFAULT 'EMPLOYEE',
  assignment_status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at TIMESTAMPTZ NULL,
  assigned_by_user_id BIGINT NULL,
  returned_by_user_id BIGINT NULL,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_asset_assignment_active_asset
  ON asset_assignments(asset_id)
  WHERE assignment_status = 'ACTIVE' AND returned_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_asset_assignment_employee
  ON asset_assignments(employee_id, assignment_status);

-- HRM-owned workflow audit. Asset master/assignment remains in the Shared Asset Module.
CREATE TABLE IF NOT EXISTS onboarding_asset_gate_events (
  id BIGSERIAL PRIMARY KEY,
  onboarding_case_id BIGINT NOT NULL,
  employee_id INTEGER NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  asset_id BIGINT NULL,
  asset_assignment_id BIGINT NULL,
  actor_user_id BIGINT NULL,
  note TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_onboarding_asset_gate_employee
  ON onboarding_asset_gate_events(employee_id, created_at DESC);

COMMIT;

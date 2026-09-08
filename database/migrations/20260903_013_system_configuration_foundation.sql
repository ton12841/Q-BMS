BEGIN;

CREATE TABLE IF NOT EXISTS system_configuration_registry (
  id BIGSERIAL PRIMARY KEY,
  config_key VARCHAR(160) NOT NULL UNIQUE,
  config_group VARCHAR(80) NOT NULL,
  value_type VARCHAR(30) NOT NULL,
  value_json JSONB NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  source_of_truth VARCHAR(80) NOT NULL,
  mutability VARCHAR(30) NOT NULL DEFAULT 'LOCKED',
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_configuration_registry_group
  ON system_configuration_registry(config_group);

CREATE INDEX IF NOT EXISTS idx_system_configuration_registry_status
  ON system_configuration_registry(status);

INSERT INTO system_configuration_registry (
  config_key,
  config_group,
  value_type,
  value_json,
  name,
  description,
  source_of_truth,
  mutability,
  status,
  sort_order
)
VALUES
  (
    'authentication.allowed_workspace_domain',
    'Authentication',
    'STRING',
    '"iquritech.com"'::jsonb,
    'Google Workspace Domain',
    'Google authentication is restricted to the company Workspace domain.',
    'AUTHENTICATION_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    10
  ),
  (
    'authentication.google_sso_required',
    'Authentication',
    'BOOLEAN',
    'true'::jsonb,
    'Google SSO Required',
    'Employee users authenticate through company Google Workspace identity.',
    'AUTHENTICATION_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    20
  ),
  (
    'access.base_employee_role',
    'Access Control',
    'STRING',
    '"EMPLOYEE"'::jsonb,
    'Base Employee Role',
    'EMPLOYEE is the canonical base Role for employee users.',
    'ACCESS_CONTROL_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    30
  ),
  (
    'access.super_admin_assignment',
    'Access Control',
    'STRING',
    '"EXPLICIT"'::jsonb,
    'Super Admin Assignment',
    'SUPER_ADMIN is never assigned automatically and must be explicit.',
    'ACCESS_CONTROL_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    40
  ),
  (
    'access.employee_permission_model',
    'Access Control',
    'STRING',
    '"ROLE_PLUS_LEVEL_GRADE_POLICY"'::jsonb,
    'Employee Permission Model',
    'Effective Employee access resolves from base Role plus Job Level / Grade policy, with Grade overriding Level for the same Employee permission.',
    'ACCESS_CONTROL_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    50
  ),
  (
    'organization.department_module_status',
    'Organization',
    'STRING',
    '"HOLD"'::jsonb,
    'Department Module Status',
    'Department is reserved in the architecture and intentionally not implemented yet.',
    'ORGANIZATION_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    60
  ),
  (
    'organization.position_grade_relationship',
    'Organization',
    'STRING',
    '"MANY_GRADES_SUPPORTED"'::jsonb,
    'Position Grade Relationship',
    'A Position may support multiple Job Grades and is not the same concept as Role.',
    'ORGANIZATION_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    70
  ),
  (
    'onboarding.state_model',
    'Onboarding',
    'STRING_LIST',
    '[
      "PRE_ONBOARDING",
      "IT_ACCOUNT_PENDING",
      "IT_ACCOUNT_READY",
      "INVITATION_SENT",
      "ONBOARDING",
      "PENDING_REVIEW",
      "ASSET_PENDING",
      "READY_TO_ACTIVATE",
      "ACTIVE"
    ]'::jsonb,
    'Employee Onboarding State Model',
    'Canonical employee onboarding state progression.',
    'EMPLOYEE_ONBOARDING_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    80
  ),
  (
    'localization.supported_locales',
    'Localization',
    'STRING_LIST',
    '["en", "lo", "th"]'::jsonb,
    'Supported Languages',
    'Q BMS user interface currently supports English, Lao and Thai.',
    'I18N_ARCHITECTURE',
    'LOCKED',
    'ACTIVE',
    90
  ),
  (
    'platform.crm_status',
    'Platform',
    'STRING',
    '"HOLD"'::jsonb,
    'CRM Migration Status',
    'CRM is reserved in the platform architecture for later migration.',
    'MODULE_MANAGEMENT_REGISTRY',
    'LOCKED',
    'ACTIVE',
    100
  )
ON CONFLICT (config_key) DO UPDATE
SET
  config_group = EXCLUDED.config_group,
  value_type = EXCLUDED.value_type,
  value_json = EXCLUDED.value_json,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  source_of_truth = EXCLUDED.source_of_truth,
  mutability = EXCLUDED.mutability,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
  'system.configuration.view',
  'View System Configuration',
  'View the canonical Q BMS system configuration registry and source-of-truth metadata.',
  'System'
)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  permission_group = EXCLUDED.permission_group;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'system.configuration.view'
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM system_configuration_registry
  WHERE config_key IN (
    'authentication.allowed_workspace_domain',
    'authentication.google_sso_required',
    'access.base_employee_role',
    'access.super_admin_assignment',
    'access.employee_permission_model',
    'organization.department_module_status',
    'organization.position_grade_relationship',
    'onboarding.state_model',
    'localization.supported_locales',
    'platform.crm_status'
  );

  IF v_count <> 10 THEN
    RAISE EXCEPTION
      'System Configuration registry verification failed. Expected 10 canonical settings, got %',
      v_count;
  END IF;
END $$;

COMMIT;

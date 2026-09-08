-- Q BMS v2.1.0
-- Google Workspace SSO + Invitation Activation
--
-- No employee email is hard-coded. Google OAuth configuration and the allowed
-- Workspace domain are deployment settings. SUPER_ADMIN is a special system
-- role and remains independent from Business Unit / Position / Grade / Level.

CREATE TABLE IF NOT EXISTS auth_oauth_states (
    id BIGSERIAL PRIMARY KEY,
    state_hash CHAR(64) NOT NULL UNIQUE,
    provider VARCHAR(30) NOT NULL DEFAULT 'GOOGLE',
    code_verifier TEXT NOT NULL,
    invitation_public_id UUID,
    return_path TEXT NOT NULL DEFAULT '/',
    ip_address VARCHAR(80),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_auth_oauth_state_provider
      CHECK (provider IN ('GOOGLE'))
);

CREATE INDEX IF NOT EXISTS idx_auth_oauth_states_expiry
    ON auth_oauth_states(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_oauth_states_invitation
    ON auth_oauth_states(invitation_public_id);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
    'system.super_admin',
    'Super Administrator',
    'Special unrestricted Q BMS system administration capability. This permission is independent from organizational position, grade and level.',
    'System Administration'
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

INSERT INTO roles (code, name, description, is_system_role, status)
VALUES (
    'SUPER_ADMIN',
    'Super Admin',
    'Special Q BMS system role. Assignment is independent from Employee Position, Job Grade, Job Level and Business Unit.',
    TRUE,
    'ACTIVE'
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system_role = TRUE,
    status = 'ACTIVE';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'system.super_admin'
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

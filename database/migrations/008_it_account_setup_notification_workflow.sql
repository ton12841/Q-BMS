-- Q BMS v2.0.14.0
-- IT Account Setup Workflow + Notification Trigger Foundation
--
-- Permanent onboarding flow:
-- HR creates New Employee
--   -> Q BMS creates IT account setup request
--   -> Q BMS emits workflow notification event for IT
--   -> IT starts setup and creates Google Workspace account
--   -> IT confirms Company Email
--   -> Q BMS prepares invitation draft + notifies HR that account is ready
--
-- External email delivery is represented by an EMAIL notification target.
-- A Google Workspace mail transport/worker can resolve and send these targets later
-- without coupling Employee or Account Setup workflows to Gmail directly.

-- =========================================================
-- 1) NOTIFICATION EVENT / DELIVERY FOUNDATION
-- =========================================================

CREATE TABLE IF NOT EXISTS notification_events (
    id BIGSERIAL PRIMARY KEY,
    event_code VARCHAR(160) NOT NULL,
    source_module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_event_code
    ON notification_events(event_code);

CREATE INDEX IF NOT EXISTS idx_notification_events_entity
    ON notification_events(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS notification_targets (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,

    channel VARCHAR(30) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_value VARCHAR(255) NOT NULL,

    recipient_user_id BIGINT REFERENCES users(id),
    recipient_email VARCHAR(255),

    delivery_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_notification_target_channel
        CHECK (channel IN ('IN_APP', 'EMAIL')),

    CONSTRAINT chk_notification_target_type
        CHECK (target_type IN ('ROLE', 'PERMISSION', 'USER', 'EMAIL')),

    CONSTRAINT chk_notification_delivery_status
        CHECK (delivery_status IN (
            'PENDING',
            'WAITING_RECIPIENT',
            'SENT',
            'READ',
            'FAILED',
            'CANCELLED'
        ))
);

CREATE INDEX IF NOT EXISTS idx_notification_targets_event_id
    ON notification_targets(event_id);

CREATE INDEX IF NOT EXISTS idx_notification_targets_delivery_status
    ON notification_targets(delivery_status);

CREATE INDEX IF NOT EXISTS idx_notification_targets_audience
    ON notification_targets(target_type, target_value);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_event_target
    ON notification_targets(event_id, channel, target_type, target_value);

-- =========================================================
-- 2) ACCOUNT SETUP AUDIT FIELDS
-- =========================================================

ALTER TABLE employee_account_setup_requests
    ADD COLUMN IF NOT EXISTS started_by_user_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS completed_by_user_id BIGINT REFERENCES users(id);

-- =========================================================
-- 3) WORKFLOW PERMISSIONS / SYSTEM ROLES
-- =========================================================
-- No user is auto-assigned to these roles. Assignment belongs to the future
-- authentication/permission administration flow.

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    (
        'employee.account_setup.manage',
        'Manage Employee Account Setup',
        'View, start and complete Google Workspace account setup requests for employees.',
        'Employee Onboarding'
    ),
    (
        'employee.onboarding.manage',
        'Manage Employee Onboarding',
        'Manage employee onboarding workflow, invitation and HR activation steps.',
        'Employee Onboarding'
    )
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

INSERT INTO roles (code, name, description, is_system_role, status)
VALUES
    (
        'IT_ACCOUNT_ADMIN',
        'IT Account Administrator',
        'IT role responsible for employee Google Workspace account setup.',
        TRUE,
        'ACTIVE'
    ),
    (
        'HR_EMPLOYEE_ADMIN',
        'HR Employee Administrator',
        'HR role responsible for employee onboarding and activation.',
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
JOIN permissions p ON p.code = 'employee.account_setup.manage'
WHERE r.code = 'IT_ACCOUNT_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'employee.onboarding.manage'
WHERE r.code = 'HR_EMPLOYEE_ADMIN'
ON CONFLICT DO NOTHING;

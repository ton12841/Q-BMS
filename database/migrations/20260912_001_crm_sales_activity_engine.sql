-- Q BMS v2.4.2.0
-- CRM Sales Activity Engine
-- Real Sales Activity records for Leads. Deal Activity linkage is reserved for a later Deal phase.

CREATE SEQUENCE IF NOT EXISTS crm_activity_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS crm_activities (
    id BIGSERIAL PRIMARY KEY,
    activity_code VARCHAR(32) NOT NULL UNIQUE
        DEFAULT ('ACT-' || LPAD(nextval('crm_activity_code_seq')::text, 6, '0')),

    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    lead_id BIGINT NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    owner_user_id BIGINT REFERENCES users(id),
    parent_activity_id BIGINT REFERENCES crm_activities(id) ON DELETE SET NULL,

    activity_type VARCHAR(40) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    purpose_note TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',

    outcome VARCHAR(80),
    result_note TEXT,
    reschedule_reason TEXT,
    completed_at TIMESTAMPTZ,

    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crm_activities_type_check CHECK (
        activity_type IN (
            'CALL', 'VISIT', 'MEETING', 'DEMO', 'FOLLOW_UP',
            'QUOTATION', 'CONTRACT', 'PAYMENT'
        )
    ),
    CONSTRAINT crm_activities_status_check CHECK (
        status IN ('SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED')
    )
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_business_unit
    ON crm_activities(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead
    ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_owner
    ON crm_activities(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_schedule
    ON crm_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status
    ON crm_activities(status);

CREATE TABLE IF NOT EXISTS crm_activity_history (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES crm_activities(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    from_scheduled_at TIMESTAMPTZ,
    to_scheduled_at TIMESTAMPTZ,
    outcome VARCHAR(80),
    note TEXT,
    actor_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crm_activity_history_event_check CHECK (
        event_type IN ('CREATED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED')
    )
);

CREATE INDEX IF NOT EXISTS idx_crm_activity_history_activity
    ON crm_activity_history(activity_id, created_at DESC);

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.activity.view', 'View CRM Activities', 'View CRM Sales Activities within the user access scope.', 'CRM'),
    ('crm.activity.manage', 'Manage CRM Activities', 'Schedule, complete and reschedule CRM Sales Activities.', 'CRM'),
    ('crm.activity.view_all', 'View All CRM Activities', 'View CRM Sales Activities across permitted Business Units and owners.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

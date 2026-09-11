-- Q BMS v2.4.1.0
-- CRM Real Lead Foundation
-- Scope: shared Multi-BU Lead records only. Activity / Deal / Quotation remain separate phases.

CREATE SEQUENCE IF NOT EXISTS crm_lead_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS crm_leads (
    id BIGSERIAL PRIMARY KEY,
    lead_code VARCHAR(32) NOT NULL UNIQUE
        DEFAULT ('LEAD-' || LPAD(nextval('crm_lead_code_seq')::text, 6, '0')),

    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    owner_user_id BIGINT REFERENCES users(id),

    store_name VARCHAR(220) NOT NULL,
    legal_company_name VARCHAR(255),
    individual_name VARCHAR(220),
    primary_contact VARCHAR(220) NOT NULL,
    phone VARCHAR(80) NOT NULL,
    email VARCHAR(255),
    whatsapp VARCHAR(120),
    province VARCHAR(160) NOT NULL,

    source VARCHAR(40) NOT NULL,
    source_detail VARCHAR(255),
    project_name VARCHAR(220),
    campaign_name VARCHAR(220),
    note TEXT,

    status VARCHAR(40) NOT NULL DEFAULT 'NEW',
    lost_reason VARCHAR(80),

    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crm_leads_source_check CHECK (
        source IN (
            'EVENT', 'FACEBOOK', 'WEBSITE', 'REFERRAL', 'PARTNER',
            'WALK_IN', 'OUTBOUND', 'IMPORT', 'OTHER', 'OWN_LEAD'
        )
    ),
    CONSTRAINT crm_leads_status_check CHECK (
        status IN (
            'UNASSIGNED', 'NEW', 'ASSIGNED', 'CONTACTED',
            'FOLLOW_UP', 'CONVERTED', 'LOST'
        )
    ),
    CONSTRAINT crm_leads_other_source_detail_check CHECK (
        source <> 'OTHER' OR NULLIF(BTRIM(source_detail), '') IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_business_unit
    ON crm_leads(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_user
    ON crm_leads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status
    ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at
    ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_bu_phone_normalized
    ON crm_leads(
        business_unit_id,
        regexp_replace(phone, '[^0-9]+', '', 'g')
    );

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.lead.view', 'View CRM Leads', 'View CRM Leads within the user access scope.', 'CRM'),
    ('crm.lead.manage', 'Manage CRM Leads', 'Create and maintain CRM Leads within the user access scope.', 'CRM'),
    ('crm.lead.view_all', 'View All CRM Leads', 'View CRM Leads across permitted Business Units, including other owners.', 'CRM'),
    ('crm.lead.assign', 'Assign CRM Leads', 'Assign or reassign CRM Leads to Sales owners.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

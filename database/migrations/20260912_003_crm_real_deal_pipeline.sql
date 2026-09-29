-- Q BMS v2.4.3.0
-- CRM Real Deal + Pipeline Foundation
-- Adds real Deal records, stage history, Lead -> Deal conversion and Deal-linked Activities.

CREATE SEQUENCE IF NOT EXISTS crm_deal_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS crm_deals (
    id BIGSERIAL PRIMARY KEY,
    deal_code VARCHAR(32) NOT NULL UNIQUE
        DEFAULT ('DEAL-' || LPAD(nextval('crm_deal_code_seq')::text, 6, '0')),

    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    source_lead_id BIGINT UNIQUE REFERENCES crm_leads(id) ON DELETE SET NULL,
    owner_user_id BIGINT REFERENCES users(id),

    store_name VARCHAR(220) NOT NULL,
    primary_contact VARCHAR(220),
    stage VARCHAR(40) NOT NULL DEFAULT 'NEW_DEAL',
    value NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'LAK',
    expected_close_date DATE,
    lost_reason VARCHAR(255),

    -- Relationship cache only. Quotation remains a separate Source of Truth.
    quotation_number VARCHAR(40),
    quotation_confirmed_at TIMESTAMPTZ,

    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crm_deals_stage_check CHECK (
        stage IN (
            'NEW_DEAL', 'DEMO', 'QUOTATION', 'NEGOTIATION',
            'CONTRACT', 'AWAITING_PAYMENT', 'CLOSED_WON', 'CLOSED_LOST'
        )
    ),
    CONSTRAINT crm_deals_currency_check CHECK (currency IN ('LAK', 'USD', 'THB')),
    CONSTRAINT crm_deals_value_check CHECK (value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_business_unit ON crm_deals(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_deals_updated_at ON crm_deals(updated_at DESC);

CREATE TABLE IF NOT EXISTS crm_deal_stage_history (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
    from_stage VARCHAR(40),
    to_stage VARCHAR(40) NOT NULL,
    reason TEXT,
    actor_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_deal
    ON crm_deal_stage_history(deal_id, created_at DESC);

ALTER TABLE crm_activities
    ADD COLUMN IF NOT EXISTS deal_id BIGINT REFERENCES crm_deals(id) ON DELETE CASCADE;

ALTER TABLE crm_activities
    ALTER COLUMN lead_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'crm_activities_related_record_check'
    ) THEN
        ALTER TABLE crm_activities
            ADD CONSTRAINT crm_activities_related_record_check
            CHECK (num_nonnulls(lead_id, deal_id) = 1);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.deal.view', 'View CRM Deals', 'View CRM Deals within the user access scope.', 'CRM'),
    ('crm.deal.manage', 'Manage CRM Deals', 'Convert Leads and manage active Deal stages.', 'CRM'),
    ('crm.deal.view_all', 'View All CRM Deals', 'View CRM Deals across permitted Business Units and owners.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

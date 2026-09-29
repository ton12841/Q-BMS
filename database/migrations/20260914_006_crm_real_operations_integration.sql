-- Q BMS v3.0.0.0
-- CRM Real Operations + Integration Full Function
-- Adds real Deal Product Lines, Point Recognition snapshots, trusted integration events,
-- and point-based commission realization without creating Product Master / Inventory / Finance tables inside CRM.

ALTER TABLE crm_deals
    ADD COLUMN IF NOT EXISTS payment_slip_uploaded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finance_payment_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(120),
    ADD COLUMN IF NOT EXISTS invoice_received_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS crm_deal_product_lines (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    product_code VARCHAR(60) NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    point_type_snapshot VARCHAR(20) NOT NULL,
    unit_label_snapshot VARCHAR(80),
    inventory_managed_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    line_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_deal_product_lines_point_type_check CHECK (point_type_snapshot IN ('SOFTWARE','HARDWARE')),
    CONSTRAINT crm_deal_product_lines_quantity_check CHECK (quantity >= 1),
    CONSTRAINT crm_deal_product_lines_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT crm_deal_product_lines_line_value_check CHECK (line_value >= 0),
    UNIQUE (deal_id, product_code)
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_product_lines_deal
    ON crm_deal_product_lines(deal_id, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_product_lines_bu_product
    ON crm_deal_product_lines(business_unit_id, product_code);

CREATE TABLE IF NOT EXISTS crm_point_recognitions (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT NOT NULL UNIQUE REFERENCES crm_deals(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    owner_user_id BIGINT REFERENCES users(id),
    period_month DATE NOT NULL,
    sw_points INTEGER NOT NULL DEFAULT 0,
    hw_points INTEGER NOT NULL DEFAULT 0,
    commission_plan_id BIGINT REFERENCES crm_commission_plans(id),
    commission_plan_name_snapshot VARCHAR(180),
    commission_tier_code VARCHAR(40),
    sw_lak_per_point NUMERIC(18,2) NOT NULL DEFAULT 0,
    hw_lak_per_point NUMERIC(18,2) NOT NULL DEFAULT 0,
    commission_amount_lak NUMERIC(18,2) NOT NULL DEFAULT 0,
    recognized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_point_recognitions_sw_check CHECK (sw_points >= 0),
    CONSTRAINT crm_point_recognitions_hw_check CHECK (hw_points >= 0),
    CONSTRAINT crm_point_recognitions_sw_rate_check CHECK (sw_lak_per_point >= 0),
    CONSTRAINT crm_point_recognitions_hw_rate_check CHECK (hw_lak_per_point >= 0),
    CONSTRAINT crm_point_recognitions_amount_check CHECK (commission_amount_lak >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_point_recognitions_owner_period
    ON crm_point_recognitions(owner_user_id, period_month);
CREATE INDEX IF NOT EXISTS idx_crm_point_recognitions_bu_period
    ON crm_point_recognitions(business_unit_id, period_month);

CREATE TABLE IF NOT EXISTS crm_point_recognition_lines (
    id BIGSERIAL PRIMARY KEY,
    recognition_id BIGINT NOT NULL REFERENCES crm_point_recognitions(id) ON DELETE CASCADE,
    deal_product_line_id BIGINT REFERENCES crm_deal_product_lines(id) ON DELETE SET NULL,
    product_code VARCHAR(60) NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    point_type_snapshot VARCHAR(20) NOT NULL,
    unit_label_snapshot VARCHAR(80),
    quantity INTEGER NOT NULL,
    points_per_unit INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_point_recognition_lines_type_check CHECK (point_type_snapshot IN ('SOFTWARE','HARDWARE')),
    CONSTRAINT crm_point_recognition_lines_quantity_check CHECK (quantity >= 1),
    CONSTRAINT crm_point_recognition_lines_points_check CHECK (points_per_unit >= 0 AND total_points >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_point_recognition_lines_recognition
    ON crm_point_recognition_lines(recognition_id, id);

CREATE TABLE IF NOT EXISTS crm_integration_events (
    id BIGSERIAL PRIMARY KEY,
    source_system VARCHAR(80) NOT NULL,
    external_event_id VARCHAR(160) NOT NULL,
    event_type VARCHAR(60) NOT NULL,
    deal_id BIGINT REFERENCES crm_deals(id) ON DELETE SET NULL,
    deal_code VARCHAR(40),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_integration_events_status_check CHECK (status IN ('RECEIVED','PROCESSED','IGNORED','FAILED')),
    CONSTRAINT crm_integration_events_type_check CHECK (event_type IN ('QUOTATION_LINKED','QUOTATION_CONFIRMED','PAYMENT_SLIP_UPLOADED','FINANCE_CONFIRMED_INVOICE')),
    UNIQUE (source_system, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_integration_events_deal
    ON crm_integration_events(deal_id, created_at DESC);

ALTER TABLE crm_commissions
    ADD COLUMN IF NOT EXISTS recognition_period DATE,
    ADD COLUMN IF NOT EXISTS recognized_sw_points INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recognized_hw_points INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_plan_id BIGINT REFERENCES crm_commission_plans(id),
    ADD COLUMN IF NOT EXISTS commission_tier_code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS sw_lak_per_point NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hw_lak_per_point NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS amount_lak NUMERIC(18,2) NOT NULL DEFAULT 0;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.integration.trusted', 'CRM Trusted Integration', 'Accept trusted Quotation / Finance events that can advance system-controlled CRM gates.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

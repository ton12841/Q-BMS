-- Q BMS v3.2.0.0
-- Shared Customer Master + CRM Closed Won integration.
-- Customer Master is shared Q BMS data. CRM links a Deal to the shared Customer when Finance closes the Deal Won.

CREATE SEQUENCE IF NOT EXISTS customer_master_code_seq START WITH 1;

CREATE TABLE IF NOT EXISTS customer_master (
    id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(60) NOT NULL UNIQUE DEFAULT ('CUS-' || LPAD(nextval('customer_master_code_seq')::text, 5, '0')),
    display_name VARCHAR(220) NOT NULL,
    legal_company_name VARCHAR(220),
    customer_type VARCHAR(20) NOT NULL DEFAULT 'BUSINESS',
    primary_contact VARCHAR(180),
    phone VARCHAR(80),
    email VARCHAR(220),
    whatsapp VARCHAR(120),
    province VARCHAR(160),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    note TEXT,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_master_type_check CHECK (customer_type IN ('BUSINESS','INDIVIDUAL')),
    CONSTRAINT customer_master_status_check CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE IF NOT EXISTS customer_master_business_units (
    customer_id BIGINT NOT NULL REFERENCES customer_master(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, business_unit_id),
    CONSTRAINT customer_master_bu_status_check CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_customer_master_display_name ON customer_master(display_name);
CREATE INDEX IF NOT EXISTS idx_customer_master_legal_name ON customer_master(legal_company_name);
CREATE INDEX IF NOT EXISTS idx_customer_master_phone ON customer_master(phone);
CREATE INDEX IF NOT EXISTS idx_customer_master_email ON customer_master(email);
CREATE INDEX IF NOT EXISTS idx_customer_master_bu ON customer_master_business_units(business_unit_id, status, customer_id);

ALTER TABLE crm_deals
    ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customer_master(id),
    ADD COLUMN IF NOT EXISTS customer_linked_at TIMESTAMPTZ;

ALTER TABLE crm_leads
    ADD COLUMN IF NOT EXISTS customer_id BIGINT REFERENCES customer_master(id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_customer ON crm_deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_customer ON crm_leads(customer_id);

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.customer.master.manage', 'CRM Customer Master Manage', 'Create and edit shared Customer Master records from CRM Settings for permitted Business Units.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

-- Align CRM Sales Ops with the canonical operating model: Sales Ops manages BU commercial setup
-- and shared Product/Customer masters, while Sales remains execution/self-scope.
UPDATE crm_role_definitions
SET capabilities = capabilities || '["product.manage","customer.manage","points.manage","targets.manage","commission.manage"]'::jsonb,
    updated_at = NOW()
WHERE code = 'SALES_OPS';

UPDATE crm_role_definitions
SET capabilities = capabilities || '["product.manage","customer.manage"]'::jsonb,
    updated_at = NOW()
WHERE code = 'CRM_BU_ADMIN';

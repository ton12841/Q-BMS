-- Q BMS v3.1.0.0
-- Shared Product Master foundation surfaced from CRM Settings.
-- Product Master is a shared source of truth; CRM only consumes it for Point Settings and Deal Product Lines.

CREATE SEQUENCE IF NOT EXISTS product_master_code_seq START WITH 11;

CREATE TABLE IF NOT EXISTS product_master (
    id BIGSERIAL PRIMARY KEY,
    product_code VARCHAR(60) NOT NULL UNIQUE DEFAULT ('PRD-' || LPAD(nextval('product_master_code_seq')::text, 4, '0')),
    product_name VARCHAR(200) NOT NULL,
    product_type VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    unit_label VARCHAR(80),
    inventory_managed BOOLEAN NOT NULL DEFAULT FALSE,
    default_unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'LAK',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    description TEXT,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_master_type_check CHECK (product_type IN ('SOFTWARE','HARDWARE')),
    CONSTRAINT product_master_status_check CHECK (status IN ('ACTIVE','INACTIVE')),
    CONSTRAINT product_master_price_check CHECK (default_unit_price >= 0),
    CONSTRAINT product_master_currency_check CHECK (currency IN ('LAK','USD','THB'))
);

CREATE TABLE IF NOT EXISTS product_master_business_units (
    product_id BIGINT NOT NULL REFERENCES product_master(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, business_unit_id),
    CONSTRAINT product_master_bu_status_check CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_product_master_name ON product_master(product_name);
CREATE INDEX IF NOT EXISTS idx_product_master_bu ON product_master_business_units(business_unit_id, status, product_id);

-- Seed the existing QPOS catalogue into the shared Product Master without changing historical CRM snapshots.
WITH seed(product_code, product_name, product_type, category, unit_label, inventory_managed, default_unit_price, currency) AS (
    VALUES
      ('PRD-0001','QPOS Handheld','SOFTWARE','POS Software','License / Year',FALSE,3000000,'LAK'),
      ('PRD-0002','QPOS QSR','SOFTWARE','POS Software','License / Year',FALSE,5000000,'LAK'),
      ('PRD-0003','QPOS FSR','SOFTWARE','POS Software','License / Year',FALSE,7000000,'LAK'),
      ('PRD-0004','QPOS Buffet','SOFTWARE','POS Software','License / Year',FALSE,9000000,'LAK'),
      ('PRD-0005','SUNMI P2','HARDWARE','POS Hardware','Unit',TRUE,5500000,'LAK'),
      ('PRD-0006','SUNMI V3E','HARDWARE','POS Hardware','Unit',TRUE,6900000,'LAK'),
      ('PRD-0007','SUNMI D3 Single Screen','HARDWARE','POS Hardware','Unit',TRUE,12900000,'LAK'),
      ('PRD-0008','SUNMI D3 Dual Screen','HARDWARE','POS Hardware','Unit',TRUE,14900000,'LAK'),
      ('PRD-0009','Printer XP-80T','HARDWARE','Peripheral','Unit',TRUE,1590000,'LAK'),
      ('PRD-0010','Cash Drawer LB-405','HARDWARE','Peripheral','Unit',TRUE,1290000,'LAK')
)
INSERT INTO product_master(product_code, product_name, product_type, category, unit_label, inventory_managed, default_unit_price, currency, status)
SELECT product_code, product_name, product_type, category, unit_label, inventory_managed, default_unit_price, currency, 'ACTIVE'
FROM seed
ON CONFLICT (product_code) DO UPDATE SET
    product_name = EXCLUDED.product_name,
    product_type = EXCLUDED.product_type,
    category = COALESCE(product_master.category, EXCLUDED.category),
    unit_label = EXCLUDED.unit_label,
    inventory_managed = EXCLUDED.inventory_managed,
    default_unit_price = EXCLUDED.default_unit_price,
    currency = EXCLUDED.currency,
    updated_at = NOW();

INSERT INTO product_master_business_units(product_id, business_unit_id, status)
SELECT pm.id, bu.id, 'ACTIVE'
FROM product_master pm
JOIN business_units bu ON bu.code = 'QPOS'
WHERE pm.product_code BETWEEN 'PRD-0001' AND 'PRD-0010'
ON CONFLICT (product_id, business_unit_id) DO NOTHING;

SELECT setval('product_master_code_seq', GREATEST(11, COALESCE((SELECT MAX(id) + 1 FROM product_master), 11)), FALSE);

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.product.master.manage', 'CRM Product Master Manage', 'Create and edit shared Product Master records from CRM Settings for permitted Business Units.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

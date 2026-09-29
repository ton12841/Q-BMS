-- Q BMS v2.5.0.0
-- CRM Sales Workspace Full Function
-- Extends Deal commercial facts, monthly Sales targets and a CRM-side commission ledger.
-- Quotation, Finance confirmation, Invoice and Closed Won remain separate Sources of Truth.

ALTER TABLE crm_deals
    ADD COLUMN IF NOT EXISTS package_code VARCHAR(40),
    ADD COLUMN IF NOT EXISTS license_quantity INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS software_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hardware_value NUMERIC(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS product_note TEXT,
    ADD COLUMN IF NOT EXISTS closed_won_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS closed_lost_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_license_quantity_check'
    ) THEN
        ALTER TABLE crm_deals
            ADD CONSTRAINT crm_deals_license_quantity_check CHECK (license_quantity >= 1);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_software_value_check'
    ) THEN
        ALTER TABLE crm_deals
            ADD CONSTRAINT crm_deals_software_value_check CHECK (software_value >= 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'crm_deals_hardware_value_check'
    ) THEN
        ALTER TABLE crm_deals
            ADD CONSTRAINT crm_deals_hardware_value_check CHECK (hardware_value >= 0);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS crm_sales_targets (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    owner_user_id BIGINT REFERENCES users(id),
    period_month DATE NOT NULL,
    target_licenses INTEGER NOT NULL DEFAULT 15,
    target_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'LAK',
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_sales_targets_license_check CHECK (target_licenses >= 0),
    CONSTRAINT crm_sales_targets_revenue_check CHECK (target_revenue >= 0),
    CONSTRAINT crm_sales_targets_currency_check CHECK (currency IN ('LAK','USD','THB'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_sales_targets_owner_period
    ON crm_sales_targets(business_unit_id, owner_user_id, period_month)
    WHERE owner_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_sales_targets_bu_default_period
    ON crm_sales_targets(business_unit_id, period_month)
    WHERE owner_user_id IS NULL;

-- QPOS current operating target. Sales Ops can override with an owner-specific target later.
INSERT INTO crm_sales_targets (
    business_unit_id, owner_user_id, period_month,
    target_licenses, target_revenue, currency
)
SELECT bu.id, NULL, DATE '2026-09-01', 15, 0, 'LAK'
FROM business_units bu
WHERE UPPER(bu.code) = 'QPOS'
  AND NOT EXISTS (
      SELECT 1
      FROM crm_sales_targets t
      WHERE t.business_unit_id = bu.id
        AND t.owner_user_id IS NULL
        AND t.period_month = DATE '2026-09-01'
  );

CREATE TABLE IF NOT EXISTS crm_commissions (
    id BIGSERIAL PRIMARY KEY,
    deal_id BIGINT NOT NULL UNIQUE REFERENCES crm_deals(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    owner_user_id BIGINT REFERENCES users(id),
    software_rate NUMERIC(8,6) NOT NULL DEFAULT 0.05,
    hardware_rate NUMERIC(8,6) NOT NULL DEFAULT 0.01,
    status VARCHAR(20) NOT NULL DEFAULT 'PROJECTED',
    confirmed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    finance_reference VARCHAR(120),
    payroll_reference VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_commissions_status_check CHECK (status IN ('PROJECTED','PENDING','CONFIRMED','PAID','VOID')),
    CONSTRAINT crm_commissions_software_rate_check CHECK (software_rate >= 0),
    CONSTRAINT crm_commissions_hardware_rate_check CHECK (hardware_rate >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crm_commissions_owner ON crm_commissions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_crm_commissions_business_unit ON crm_commissions(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_crm_commissions_status ON crm_commissions(status);

-- Backfill existing Deals without inventing Software / Hardware classification.
INSERT INTO crm_commissions (deal_id, business_unit_id, owner_user_id, status)
SELECT d.id, d.business_unit_id, d.owner_user_id,
       CASE
           WHEN d.stage = 'CLOSED_LOST' THEN 'VOID'
           WHEN d.stage = 'CLOSED_WON' THEN 'PENDING'
           ELSE 'PROJECTED'
       END
FROM crm_deals d
ON CONFLICT (deal_id) DO NOTHING;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.performance.view', 'View My CRM Performance', 'View personal CRM Target vs Achievement.', 'CRM'),
    ('crm.commission.view', 'View My CRM Commission', 'View personal CRM commission projection and Finance status.', 'CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

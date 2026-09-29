-- Q BMS v2.6.0.0
-- CRM BU Access + Settings Full Function
-- CRM remains an independent Tool that references BMS users/employees/business_units.
-- BMS Tool Access / Request / Approval stays a platform concern and can be connected later.

CREATE TABLE IF NOT EXISTS crm_bu_settings (
    business_unit_id BIGINT PRIMARY KEY REFERENCES business_units(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    currency VARCHAR(3) NOT NULL DEFAULT 'LAK',
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Vientiane',
    default_sw_point_target INTEGER NOT NULL DEFAULT 30,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_bu_settings_status_check CHECK (status IN ('ACTIVE','INACTIVE')),
    CONSTRAINT crm_bu_settings_currency_check CHECK (currency IN ('LAK','THB','USD')),
    CONSTRAINT crm_bu_settings_default_target_check CHECK (default_sw_point_target >= 0)
);

INSERT INTO crm_bu_settings (business_unit_id, currency, timezone, default_sw_point_target)
SELECT id,
       CASE WHEN UPPER(code) = 'QPOS' THEN 'LAK' ELSE 'LAK' END,
       CASE WHEN UPPER(code) = 'QPOS' THEN 'Asia/Vientiane' ELSE 'Asia/Bangkok' END,
       30
FROM business_units
ON CONFLICT (business_unit_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_role_definitions (
    code VARCHAR(40) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    access_level SMALLINT NOT NULL DEFAULT 1,
    data_scope VARCHAR(20) NOT NULL DEFAULT 'SELF',
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_role_definitions_level_check CHECK (access_level BETWEEN 0 AND 4),
    CONSTRAINT crm_role_definitions_scope_check CHECK (data_scope IN ('SELF','TEAM','BU','MULTI_BU','ALL'))
);

INSERT INTO crm_role_definitions (code, name, description, access_level, data_scope, capabilities)
VALUES
('CRM_BU_ADMIN','CRM BU Admin','Configure CRM and manage access inside one CRM Business Unit.',4,'BU','["settings.view","settings.manage","members.manage","teams.manage","pipeline.manage","points.manage","targets.manage","commission.manage","lead.shared.view","lead.assign","deal.shared.view","activity.shared.view","performance.team.view","commission.team.view"]'::jsonb),
('SALES_OPS','Sales Ops','Operate and analyze the sales team inside the assigned CRM Business Unit.',3,'BU','["settings.view","lead.shared.view","lead.assign","deal.shared.view","activity.shared.view","performance.team.view","commission.team.view"]'::jsonb),
('SALES_MANAGER','Sales Manager','Manage sales execution for assigned team.',3,'TEAM','["lead.team.view","deal.team.view","activity.team.view","performance.team.view","commission.team.view"]'::jsonb),
('SALES','Sales','Personal sales workspace.',2,'SELF','["lead.self.view","lead.self.manage","deal.self.view","deal.self.manage","activity.self.view","activity.self.manage","performance.self.view","commission.self.view"]'::jsonb),
('LEAD_CONTRIBUTOR','Lead Contributor','Create or import Leads without sales performance or commission access.',2,'BU','["lead.shared.create"]'::jsonb),
('VIEWER','Viewer','Read-only CRM visibility within assigned scope.',1,'BU','["lead.shared.view","deal.shared.view","activity.shared.view"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    access_level = EXCLUDED.access_level,
    data_scope = EXCLUDED.data_scope,
    capabilities = EXCLUDED.capabilities,
    is_active = TRUE,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS crm_bu_memberships (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_bu_memberships_status_check CHECK (status IN ('ACTIVE','INACTIVE')),
    CONSTRAINT crm_bu_memberships_dates_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
    UNIQUE (business_unit_id, user_id)
);

CREATE TABLE IF NOT EXISTS crm_bu_membership_roles (
    membership_id BIGINT NOT NULL REFERENCES crm_bu_memberships(id) ON DELETE CASCADE,
    role_code VARCHAR(40) NOT NULL REFERENCES crm_role_definitions(code),
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (membership_id, role_code)
);

CREATE TABLE IF NOT EXISTS crm_sales_teams (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    team_code VARCHAR(60) NOT NULL,
    name VARCHAR(160) NOT NULL,
    manager_user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_sales_teams_status_check CHECK (status IN ('ACTIVE','INACTIVE')),
    UNIQUE (business_unit_id, team_code)
);

CREATE TABLE IF NOT EXISTS crm_sales_team_members (
    team_id BIGINT NOT NULL REFERENCES crm_sales_teams(id) ON DELETE CASCADE,
    membership_id BIGINT NOT NULL REFERENCES crm_bu_memberships(id) ON DELETE CASCADE,
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, membership_id)
);

CREATE TABLE IF NOT EXISTS crm_pipeline_stage_settings (
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    stage_code VARCHAR(40) NOT NULL,
    label VARCHAR(120) NOT NULL,
    position INTEGER NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_system_controlled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by_user_id BIGINT REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (business_unit_id, stage_code),
    CONSTRAINT crm_pipeline_stage_position_check CHECK (position > 0)
);

INSERT INTO crm_pipeline_stage_settings (business_unit_id, stage_code, label, position, is_enabled, is_system_controlled)
SELECT bu.id, v.stage_code, v.label, v.position, TRUE, v.system_controlled
FROM business_units bu
CROSS JOIN (VALUES
    ('NEW_DEAL','New Deal',1,FALSE),
    ('DEMO','Demo',2,FALSE),
    ('QUOTATION','Quotation',3,FALSE),
    ('NEGOTIATION','Negotiation',4,FALSE),
    ('CONTRACT','Contract',5,FALSE),
    ('AWAITING_PAYMENT','Awaiting Payment',6,FALSE),
    ('CLOSED_WON','Closed Won',7,TRUE),
    ('CLOSED_LOST','Closed Lost',8,FALSE)
) AS v(stage_code,label,position,system_controlled)
ON CONFLICT (business_unit_id, stage_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_point_rules (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    point_type VARCHAR(20) NOT NULL,
    unit_label VARCHAR(80),
    points_per_unit INTEGER NOT NULL DEFAULT 0,
    locked_at TIMESTAMPTZ,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_point_rules_type_check CHECK (point_type IN ('SOFTWARE','HARDWARE')),
    CONSTRAINT crm_point_rules_points_check CHECK (points_per_unit >= 0),
    UNIQUE (business_unit_id, period_month, product_code)
);

-- QPOS product references from the current operating catalog. Point values intentionally start at 0
-- because Ton's GS screenshots did not expose the numeric point per product. They must be set in CRM BU Settings.
INSERT INTO crm_point_rules (business_unit_id, period_month, product_code, product_name, point_type, unit_label, points_per_unit)
SELECT bu.id, DATE '2026-09-01', v.product_code, v.product_name, v.point_type, v.unit_label, 0
FROM business_units bu
CROSS JOIN (VALUES
    ('PRD-0001','QPOS Handheld','SOFTWARE','License / Year'),
    ('PRD-0002','QPOS QSR','SOFTWARE','License / Year'),
    ('PRD-0003','QPOS FSR','SOFTWARE','License / Year'),
    ('PRD-0004','QPOS Buffet','SOFTWARE','License / Year'),
    ('PRD-0005','SUNMI P2','HARDWARE','Unit'),
    ('PRD-0006','SUNMI V3E','HARDWARE','Unit'),
    ('PRD-0007','SUNMI D3 Single Screen','HARDWARE','Unit'),
    ('PRD-0008','SUNMI D3 Dual Screen','HARDWARE','Unit'),
    ('PRD-0009','Printer','HARDWARE','Unit'),
    ('PRD-0010','Cash Drawer','HARDWARE','Unit')
) AS v(product_code,product_name,point_type,unit_label)
WHERE UPPER(bu.code) = 'QPOS'
ON CONFLICT (business_unit_id, period_month, product_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_sales_point_targets (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    team_id BIGINT REFERENCES crm_sales_teams(id) ON DELETE CASCADE,
    owner_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    target_sw_points INTEGER NOT NULL DEFAULT 30,
    target_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'LAK',
    locked_at TIMESTAMPTZ,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_sales_point_targets_points_check CHECK (target_sw_points >= 0),
    CONSTRAINT crm_sales_point_targets_revenue_check CHECK (target_revenue >= 0),
    CONSTRAINT crm_sales_point_targets_currency_check CHECK (currency IN ('LAK','THB','USD')),
    CONSTRAINT crm_sales_point_targets_scope_check CHECK (NOT (team_id IS NOT NULL AND owner_user_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_sales_point_targets_user
    ON crm_sales_point_targets(business_unit_id, period_month, owner_user_id)
    WHERE owner_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_sales_point_targets_team
    ON crm_sales_point_targets(business_unit_id, period_month, team_id)
    WHERE team_id IS NOT NULL AND owner_user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_sales_point_targets_bu_default
    ON crm_sales_point_targets(business_unit_id, period_month)
    WHERE team_id IS NULL AND owner_user_id IS NULL;

INSERT INTO crm_sales_point_targets (business_unit_id, period_month, target_sw_points, target_revenue, currency)
SELECT id, DATE '2026-09-01', 30, 0, 'LAK'
FROM business_units
WHERE UPPER(code) = 'QPOS'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS crm_commission_plans (
    id BIGSERIAL PRIMARY KEY,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    scope_type VARCHAR(20) NOT NULL DEFAULT 'BU',
    team_id BIGINT REFERENCES crm_sales_teams(id) ON DELETE CASCADE,
    owner_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    model_type VARCHAR(60) NOT NULL DEFAULT 'SW_FINAL_TIER_HW_FIXED',
    hardware_lak_per_point NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    rule_source VARCHAR(120),
    locked_at TIMESTAMPTZ,
    created_by_user_id BIGINT REFERENCES users(id),
    updated_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT crm_commission_plans_status_check CHECK (status IN ('OPEN','LOCKED','INACTIVE')),
    CONSTRAINT crm_commission_plans_scope_type_check CHECK (scope_type IN ('BU','TEAM','USER')),
    CONSTRAINT crm_commission_plans_scope_check CHECK (
      (scope_type = 'BU' AND team_id IS NULL AND owner_user_id IS NULL) OR
      (scope_type = 'TEAM' AND team_id IS NOT NULL AND owner_user_id IS NULL) OR
      (scope_type = 'USER' AND team_id IS NULL AND owner_user_id IS NOT NULL)
    ),
    CONSTRAINT crm_commission_plans_hw_rate_check CHECK (hardware_lak_per_point >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_commission_plans_bu
    ON crm_commission_plans(business_unit_id, period_month)
    WHERE scope_type = 'BU';
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_commission_plans_team
    ON crm_commission_plans(business_unit_id, period_month, team_id)
    WHERE scope_type = 'TEAM';
CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_commission_plans_user
    ON crm_commission_plans(business_unit_id, period_month, owner_user_id)
    WHERE scope_type = 'USER';

CREATE TABLE IF NOT EXISTS crm_commission_tiers (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT NOT NULL REFERENCES crm_commission_plans(id) ON DELETE CASCADE,
    tier_code VARCHAR(40) NOT NULL,
    name VARCHAR(100) NOT NULL,
    min_sw_points INTEGER NOT NULL,
    max_sw_points INTEGER,
    lak_per_sw_point NUMERIC(18,2) NOT NULL,
    position INTEGER NOT NULL,
    CONSTRAINT crm_commission_tiers_min_check CHECK (min_sw_points >= 0),
    CONSTRAINT crm_commission_tiers_max_check CHECK (max_sw_points IS NULL OR max_sw_points >= min_sw_points),
    CONSTRAINT crm_commission_tiers_rate_check CHECK (lak_per_sw_point >= 0),
    UNIQUE (plan_id, tier_code)
);

DO $$
DECLARE
    qpos_id BIGINT;
    qpos_plan_id BIGINT;
BEGIN
    SELECT id INTO qpos_id FROM business_units WHERE UPPER(code) = 'QPOS' LIMIT 1;
    IF qpos_id IS NOT NULL THEN
        INSERT INTO crm_commission_plans (
            business_unit_id, period_month, scope_type, name, model_type,
            hardware_lak_per_point, status, rule_source
        ) VALUES (
            qpos_id, DATE '2026-09-01', 'BU', 'QPOS Standard Commission',
            'SW_FINAL_TIER_HW_FIXED', 25000, 'OPEN', '2026-08'
        ) ON CONFLICT (business_unit_id, period_month) WHERE scope_type = 'BU' DO UPDATE SET
            name = EXCLUDED.name,
            model_type = EXCLUDED.model_type,
            hardware_lak_per_point = EXCLUDED.hardware_lak_per_point,
            rule_source = EXCLUDED.rule_source,
            updated_at = NOW()
        RETURNING id INTO qpos_plan_id;

        INSERT INTO crm_commission_tiers (plan_id, tier_code, name, min_sw_points, max_sw_points, lak_per_sw_point, position)
        VALUES
            (qpos_plan_id,'BASE','Base',0,29,100000,1),
            (qpos_plan_id,'TIER_1','Tier 1',30,35,130000,2),
            (qpos_plan_id,'TIER_2','Tier 2',36,44,150000,3),
            (qpos_plan_id,'TIER_3','Tier 3',45,59,180000,4),
            (qpos_plan_id,'TIER_4','Tier 4',60,NULL,200000,5)
        ON CONFLICT (plan_id, tier_code) DO UPDATE SET
            name = EXCLUDED.name,
            min_sw_points = EXCLUDED.min_sw_points,
            max_sw_points = EXCLUDED.max_sw_points,
            lak_per_sw_point = EXCLUDED.lak_per_sw_point,
            position = EXCLUDED.position;

    END IF;
END $$;

INSERT INTO permissions (code, name, description, permission_group)
VALUES
    ('crm.bu.settings.view','View CRM BU Settings','View CRM BU configuration and access setup.','CRM'),
    ('crm.bu.settings.manage','Manage CRM BU Settings','Manage CRM BU general configuration.','CRM'),
    ('crm.members.manage','Manage CRM Members','Assign CRM BU membership and CRM roles.','CRM'),
    ('crm.teams.manage','Manage CRM Sales Teams','Manage CRM sales teams and team membership.','CRM'),
    ('crm.pipeline.settings.manage','Manage CRM Pipeline Settings','Configure CRM pipeline stages per BU.','CRM'),
    ('crm.point.settings.manage','Manage CRM Point Settings','Configure monthly software/hardware product point rules.','CRM'),
    ('crm.target.settings.manage','Manage CRM Sales Targets','Configure monthly software point and revenue targets.','CRM'),
    ('crm.commission.settings.manage','Manage CRM Commission Settings','Configure monthly CRM commission plans and tiers.','CRM')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

CREATE INDEX IF NOT EXISTS idx_crm_bu_memberships_user ON crm_bu_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_sales_teams_bu ON crm_sales_teams(business_unit_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_point_rules_bu_period ON crm_point_rules(business_unit_id, period_month);
CREATE INDEX IF NOT EXISTS idx_crm_sales_point_targets_bu_period ON crm_sales_point_targets(business_unit_id, period_month);
CREATE INDEX IF NOT EXISTS idx_crm_commission_plans_bu_period ON crm_commission_plans(business_unit_id, period_month);

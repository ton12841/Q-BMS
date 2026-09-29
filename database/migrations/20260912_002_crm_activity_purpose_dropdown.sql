-- Q BMS v2.4.2.1
-- CRM Activity Purpose Dropdown
-- Standardizes Activity Purpose while retaining the legacy subject column for compatibility.

ALTER TABLE crm_activities
    ADD COLUMN IF NOT EXISTS purpose_code VARCHAR(80),
    ADD COLUMN IF NOT EXISTS purpose_detail VARCHAR(255);

UPDATE crm_activities
SET purpose_code = 'OTHER',
    purpose_detail = COALESCE(NULLIF(BTRIM(subject), ''), 'Legacy Activity')
WHERE purpose_code IS NULL;

ALTER TABLE crm_activities
    ALTER COLUMN purpose_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_activities_purpose
    ON crm_activities(activity_type, purpose_code);

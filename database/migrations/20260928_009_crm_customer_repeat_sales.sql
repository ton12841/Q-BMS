-- Q BMS v3.3.0.0
-- Customer 360 + Repeat Sales.
-- Existing Customers can create a new CRM Deal directly without creating a duplicate Lead.

-- A Deal may originate from either a Lead or an existing Customer.
-- Lead-originated Deals keep source_lead_id; repeat-sale Deals use customer_id and no source Lead.
ALTER TABLE crm_deals
    ALTER COLUMN source_lead_id DROP NOT NULL;

-- Customer link index is created by v3.2 migration 008; keep this migration intentionally minimal.

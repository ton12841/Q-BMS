# CRM v3.3.0.0 — Customer 360 + Repeat Sales Full Function

## Purpose
Turn Customer Master from a flat customer list into an operational account view without changing ownership of the shared Customer Master.

## Customer 360
The CRM Customers page now shows, per visible Customer:
- Customer Master identity and contact data.
- Open Opportunity count and LAK pipeline value.
- Closed Won count and lifetime Won value.
- Purchased Product history aggregated from immutable Closed Won Deal Product Line snapshots.
- Full linked Deal / Opportunity history with one-click Deal Detail access.

Customer visibility continues to follow CRM role/scope rules (Self / Team / BU / Preview).

## Repeat Sales / Existing Customer Opportunity
An active existing Customer can start a new Deal directly from Customer 360:

`Customer -> New Opportunity -> Product Master lines -> NEW_DEAL`

This flow deliberately does **not** create a duplicate Lead or Customer record. The new Deal is linked to the existing shared Customer ID from creation.

Rules:
- At least one active Product Master item is required.
- Product Lines remain the Deal commercial source of truth.
- Deal value is derived from Product Lines.
- The authenticated CRM user becomes the new Opportunity owner.
- A Projected Commission record and Deal Stage History are created with the Deal.
- Closed Won remains system-controlled by the existing Finance confirmation + Invoice gate.

## Architecture
- Customer Master remains shared operational master data, not CRM Settings data.
- CRM owns the Deal / Activity workflow only.
- Migration `20260928_009_crm_customer_repeat_sales.sql` allows `crm_deals.source_lead_id` to be nullable so a Deal may originate from either a Lead or an existing Customer.
- Customer link fields continue to come from migration `20260926_008_customer_master_closed_won_integration.sql`.

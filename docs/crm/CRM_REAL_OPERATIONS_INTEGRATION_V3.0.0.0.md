# Q BMS v3.0.0.0 — CRM Real Operations + Integration Full Function

## Purpose
Move CRM from browser-only trial mechanics to a real operational foundation while keeping the Q BMS Tool architecture intact: one CRM, shared data/workflow, role/scope-driven experience.

## Product architecture
CRM does **not** own Product Master or Inventory. Until those Tools exist, CRM reads a controlled temporary Product Selector. The selector is the integration seam for a future Product Master API. Hardware carries an `inventoryManaged` snapshot so Inventory can integrate later without redesigning the Deal model.

## Point Settings
- Product is selected from the controlled Product Selector; never free text.
- Sales Ops / CRM BU Admin can add Product Point Rules for the selected BU/month.
- A Point Rule can be removed from that BU/month and saved even when the month has zero rules.
- Removing a Point Rule does **not** delete the Product.
- Historical locked periods remain protected.
- Backend re-validates Product code/name/type/unit against the controlled Product source.

## Deal Product Lines
Create Deal now requires at least one Product Line. Sales can add multiple Software and Hardware products, edit Quantity and Unit Price, and remove lines before saving.

Deal commercial totals are derived from Product Lines:
- Software Value = sum of Software lines
- Hardware Value = sum of Hardware lines
- Deal Value = Software + Hardware
- Software Quantity = total Software quantity

Open Deals allow Product Lines to be edited later. Closed Won / Closed Lost Product Lines are locked.

## Point recognition and commission
Real Deal Product Lines are persisted. Point is recognized only after a trusted Finance confirmation + Invoice closes the Deal Won. Recognition stores immutable Product/Point snapshots for history.

QPOS commission remains point-based:
- SW uses the final monthly tier for **all** SW points in that month.
- HW uses fixed LAK per HW point.
- Monthly tier recalculation updates all recognized deals for that owner/month while preserving the recognition snapshots.

## Trusted integration contract
`POST /api/crm/integrations/events` accepts authenticated callers with `crm.integration.trusted` for:
- `QUOTATION_LINKED`
- `QUOTATION_CONFIRMED`
- `PAYMENT_SLIP_UPLOADED`
- `FINANCE_CONFIRMED_INVOICE`

Events are idempotent by `sourceSystem + externalEventId`. Closed Won remains system-controlled.

## Database
Migration: `20260914_006_crm_real_operations_integration.sql`

Adds:
- Deal Product Lines
- Point Recognition + line snapshots
- Trusted Integration Events
- Finance/Invoice gate facts on Deal
- Point-based realization fields on Commission

No Employee/HR/Product Master/Inventory/Finance tables are created or modified by this patch.

# Q BMS CRM v2.6.1.0 — Product Selector Foundation

## Purpose

Prepare CRM Point Settings for the future shared Product Master and Inventory modules without creating a CRM-owned product master.

## Canonical rules

- Product in CRM Point Settings is selected from a controlled source; product name is never free text.
- Current source is a temporary QPOS catalog adapter only because Product Master is not built yet.
- The UI contract is already Product-Master-ready: product code, name, type, unit, active status, and inventory-managed flag.
- When Product Master is available, replace the backend product resolver; the Point Settings UI does not need to be redesigned.
- SOFTWARE and HARDWARE point type comes from the product source.
- Hardware products are marked `inventoryManaged=true` to prepare for future Inventory integration.
- Point Rules remain CRM-owned business configuration by BU + month.
- Historical period locking remains unchanged.

## UI

Point Settings now includes:

- Search Product
- Product dropdown
- Selected product metadata
- `+ Add Product Point Rule`
- Existing configured point rules with Product Source / Inventory-ready indication

The initial temporary QPOS product list remains PRD-0001 through PRD-0010. This is seed data, not a fixed product schema.

## Future integration seam

Current:

`Temporary Product Selector -> CRM Point Rule`

Future:

`Product Master API -> CRM Product Selector -> CRM Point Rule`

Hardware future flow:

`Product Master -> Inventory -> CRM Deal Product Line -> Closed Won -> Point Recognition / Commission`

No Product Master, Inventory, Employee, HR, Finance, or other cross-tool module is created or modified by this patch.

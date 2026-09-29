# CRM Product Master v3.1.0.0

Product Master is now a shared Q BMS source of truth surfaced under CRM Settings for the selected Business Unit.

## Functions
- Create Product with auto-generated stable `PRD-xxxx` code.
- Edit Product Name, Software/Hardware Type, Category, Unit, Default Price, Currency, Inventory Managed flag and Description.
- Activate / Inactivate a Product without deleting historical references.
- CRM Point Settings and Deal Product Lines now resolve products from Product Master.
- Existing QPOS product catalogue is seeded into Product Master during migration.
- Deal and Point Recognition historical snapshots remain immutable even when Product Master changes later.

## Architecture
The database tables are shared (`product_master`, `product_master_business_units`) rather than CRM-owned tables. This allows a future standalone Product Tool to use the same master without migrating or duplicating data.

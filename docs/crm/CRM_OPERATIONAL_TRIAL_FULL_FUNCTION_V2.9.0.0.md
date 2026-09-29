# CRM Operational Trial Full Function — v2.9.0.0

## Purpose
v2.9.0.0 makes the unified role-based CRM safe to operate end-to-end before Product Master, Inventory, Quotation and Finance tools are fully connected.

The CRM remains one Tool with one data model and one navigation structure. Role + Scope + BU context control the experience.

## QA Demo Data Mode
Development/QA builds expose a Data Source selector:
- Real Data — normal CRM backend and database.
- QA Demo Data — browser-isolated sample data stored in localStorage.

QA Demo mutations never call the real CRM write APIs. Reset Demo Data restores the browser-local sample dataset.

In Real Data, Role Preview remains read-only. In QA Demo Data, Role Preview becomes interactive so Sales, Sales Manager, Sales Ops, CRM BU Admin and Viewer experiences can be tested safely.

## Operational trial flows
QA Demo supports:
- Create Lead.
- Assign / reassign / unassign Lead from shared scope.
- Schedule, complete and reschedule Activities.
- Convert Lead to Deal.
- Edit Deal commercial fields.
- Drag/change Pipeline stage, including required Lost Reason.
- Configure CRM BU Settings against browser-local QA data.
- Configure Point Rules using the temporary Product Selector source.
- Add QA Deal Product Lines with SW/HW products.
- Simulate future external gates: Quotation link, Quotation confirmation, Payment Slip, Finance confirmation + Invoice.
- System-controlled Closed Won after simulated Finance confirmation.
- Point recognition snapshots at Closed Won.
- Recognized SW/HW Point and commission appear in both personal and shared Team/BU views when snapshots exist.
- QPOS point-based commission recalculation using final monthly SW tier plus fixed HW Point rate.

## Product architecture
The temporary product list is only a QA/transition source. Product remains selected from a dropdown/search source and is not free text.

Future source:
Product Master -> CRM Product Selector -> Deal Product Lines -> Point Recognition.

Inventory-managed Hardware is marked for future Inventory integration. CRM does not own stock.

## QPOS commission rules in QA Demo
- SW 0-29: 100,000 LAK / Point
- SW 30-35: 130,000 LAK / Point
- SW 36-44: 150,000 LAK / Point
- SW 45-59: 180,000 LAK / Point
- SW 60+: 200,000 LAK / Point
- HW: 25,000 LAK / Point

SW tier is final-monthly-tier, not progressive. Point Rules start at 0 and must be configured in QA Settings before recognition if points are desired.

## Production boundaries
This patch does not create Product Master, Inventory, Quotation, Finance, Installation or Activation production data.
It does not modify Employee/HR.
It adds no database migration.

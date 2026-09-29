# CRM v3.2.0.0 — Customers Main Workspace + Closed Won Integration

## Design rule
Customer Master is shared operational master data. It is not a CRM Settings page.

## CRM navigation
Home | Leads | Pipeline | Activities | Customers | Performance | Commission | Settings

## Role-based Customers experience
- Sales: customers linked to Deals in Self scope.
- Sales Manager: customers linked to Deals in Team scope.
- Sales Ops: BU customer view; customer maintenance when authorized.
- CRM BU Admin: BU customer view and maintenance.
- Viewer: read-only by available CRM data scope.

## Closed Won
Trusted Finance confirmation with Invoice may close a Deal as Won. The transaction creates or links the shared Customer Master record, links the source Lead and Deal to the Customer, then recognizes Point and Commission snapshots.

## Shared Customer ID
The same Customer identity is intended for future Finance, Installation, Activation, Inventory, Support and Renewal tools.

# Q BMS v2.3.3.0 — Platform-wide QA Data Mode

## Goal

Every Q BMS Module and Business Tool must be previewable with populated,
isolated QA sample data without creating real business records.

QA Data Mode is an in-module experience, not a separate developer-only
catalog.

## Canonical coverage

10 Shared Modules:
1. Employee
2. Organization
3. Customer
4. Product
5. Supplier / Vendor
6. Location / Site
7. Asset
8. Document
9. Task & Approval
10. Notification

9 Business / Administration Tools:
1. HRM
2. Inventory
3. Installation
4. Financial
5. Procurement
6. Management Dashboard
7. CRM (HOLD)
8. IT Admin
9. Super Admin

## Usage

In local Development Preview, each recognized module page shows:

Real Data | QA Data Mode

QA Data Mode is available at:

`/qa-data/:moduleKey`

Modules that do not yet have a completed real-data implementation receive a
real-data landing page at:

`/module/:moduleKey`

The landing page is explicit about the real implementation status and provides
a QA Data Mode entry.

## Isolation

QA sample data:
- is static frontend data
- never writes PostgreSQL
- never creates Employee, Customer, Product, Stock, Installation, Invoice or PO records
- never enters real reports or dashboards
- never creates business audit events
- never sends notifications
- is visible only when the current session is DEVELOPMENT_PREVIEW

## Organization

Organization QA includes a populated hierarchy with:
- 14 sample Employees
- multiple Business Units
- multiple Grade / Level combinations
- Primary Reporting relationships
- Dotted Reporting examples
- top-level employee

This allows the Organization Chart design to be evaluated without creating any
real Employee Master records.

## Future standard

Every new Q BMS module/page should register a QA dataset or scenario in the
same framework before the module is considered UI-complete.

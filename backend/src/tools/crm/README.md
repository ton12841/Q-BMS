# tools/crm

Status: ACTIVE DEVELOPMENT — REAL LEAD FOUNDATION

Backend architecture:

Route -> Controller -> Service -> Repository -> PostgreSQL

## v2.4.1.0

Real Lead records are now CRM-owned PostgreSQL data.

Implemented:
- Multi-BU Lead ownership context.
- Role / Permission access boundary (`crm.lead.*`).
- Sales own-record scope by default; `crm.lead.view_all` expands visibility.
- Required Lead fields: Store / Trading Name, Primary Contact, Phone, Province, Source, Business Unit.
- Optional Email / WhatsApp and future identity/context fields.
- Other Source requires detail.
- Soft duplicate protection by normalized phone + BU; caller may explicitly continue.
- Audit event `CRM_LEAD_CREATED`.
- Lead Code running independently from BU (`LEAD-000001`, ...).

Not in this patch:
- Activity persistence.
- Deal / Pipeline persistence.
- Assignment UI / Sales Ops queue.
- Quotation integration.
- Customer conversion.

Canonical ownership remains:
- Lead / Deal / Activity -> CRM
- Customer -> Shared Customer Master
- Product -> Shared Product Master
- Quotation -> Quotation Tool
- Payment -> Financial Module
- Installation -> Installation Tool
- Activation / Subscription -> Subscription / QPOS backend

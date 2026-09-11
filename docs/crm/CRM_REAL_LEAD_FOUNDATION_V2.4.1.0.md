# Q BMS CRM Real Lead Foundation — v2.4.1.0

## Scope
This patch moves **Lead** from frontend QA state to PostgreSQL + Backend API.
Activity and Deal/Pipeline remain QA preview data for the next CRM phases.

## Canonical Lead rules implemented
- CRM is shared and Multi-BU; QPOS is the first business context only.
- Lead requires Business Unit.
- Project and Campaign columns exist for later workflows but are not required at intake.
- Minimum intake: Store / Trading Name, Primary Contact, Phone, Province, Source.
- Email and WhatsApp are optional.
- `OTHER` Source requires an Other Source Detail.
- Lead Code is global running sequence and does not reset by BU.
- Same-phone duplicate in the same BU triggers a warning; user may explicitly continue.
- Sales default visibility is own Lead records.
- `crm.lead.view_all` expands visibility for Sales Ops / Management roles.
- BU context for normal users is derived from Employee BU assignments unless expanded by permission.
- Create Lead writes `CRM_LEAD_CREATED` to Q BMS Audit Log.

## API
- `GET /api/crm/context/business-units`
- `GET /api/crm/leads?business_unit=QPOS`
- `GET /api/crm/leads/:leadCode`
- `POST /api/crm/leads`

## Deferred
- Sales Ops assignment / unassigned marketing pool UI
- Edit Lead Profile after Call
- Activity Engine
- Convert Lead to Deal
- Quotation integration
- Lost workflow

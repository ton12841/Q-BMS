# tools/crm

Status: FOUNDATION / ACTIVE DEVELOPMENT

CRM is a shared Multi-BU business tool. QPOS is the first production business context, but the architecture must not hard-code QPOS.

Backend architecture standard:

Route -> Controller -> Service -> Repository -> PostgreSQL

## Foundation rules

- Lead / Deal / Activity are CRM-owned business records.
- Every Lead and Deal has an owning Business Unit; Project and Campaign are optional context.
- Activity inherits BU from its Lead / Deal.
- Customer remains a Shared Master, not CRM-owned.
- Product remains a Shared Master and is filtered by BU when selected from CRM / Quotation.
- Quotation is a separate shared Tool and links back to CRM by source reference.
- Payment confirmation belongs to Financial Module.
- Installation status belongs to Installation Tool.
- Activation / subscription belongs to the future Subscription / QPOS backend integration.
- CRM must preserve stage history and audit events.
- UI is i18n-ready for Lao, English and Thai; business codes remain language-neutral.

Phase v2.4.0.0 starts the CRM frontend foundation and QA workflow. Real CRM API and database migration follow in later CRM patches.

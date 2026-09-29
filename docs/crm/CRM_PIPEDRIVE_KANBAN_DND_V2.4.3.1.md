# Q BMS CRM v2.4.3.1 — Pipedrive-style Pipeline Drag & Drop

## Scope

This patch enhances **My Pipeline** on top of `v2.4.3.0 CRM Real Deal + Pipeline`.

### UX
- Horizontal Kanban board inspired by Pipedrive interaction patterns.
- Deal cards are draggable between active stages.
- Non-linear movement is supported: a Deal can move forward or backward directly.
- Each stage header shows Deal count and stage value summary (currency-aware).
- Pipeline summary shows Open Deals, Open Value, Closed Won and Closed Lost counts.
- Deal cards show Next Activity state: No Activity / Overdue / Today / Upcoming.
- `Mark as Lost` is a drag target; dropping there opens the existing Lost Reason flow.
- `Closed Won` is visibly locked and remains system-controlled by Finance confirmation + Invoice.

### Existing business rules preserved
- Quotation stage requires a linked Quotation.
- Awaiting Payment requires a customer-confirmed Quotation.
- Closed Won cannot be set manually.
- Closed Deals cannot be moved manually.
- Stage changes persist through the existing CRM Deal Stage API and PostgreSQL stage history/audit log.

## Database
No new migration is required for v2.4.3.1.

## Files
- `frontend/src/tools/crm/CRMWorkspaceClient.tsx`
- `frontend/src/tools/crm/CRMPipeline.module.css`

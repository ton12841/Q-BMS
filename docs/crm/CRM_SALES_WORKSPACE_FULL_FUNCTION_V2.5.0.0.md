# Q BMS v2.5.0.0 — CRM Sales Workspace Full Function

## Goal
Deliver the Sales-facing CRM as one coherent operating flow instead of incremental UI-only patches.

## Sales Workspace
Main navigation:

- My Day
- My Leads
- My Pipeline
- My Performance
- My Commission

There is no standalone Activities main tab. Activity remains a first-class CRM record and is surfaced through My Day and Lead / Deal timelines.

## End-to-end flow
1. Create real Lead.
2. Schedule Lead Activity using Type → Purpose → Schedule → Note.
3. Complete / Reschedule Activity. Complete captures Outcome + Result / Discussion + optional Next Activity.
4. Convert Lead to Deal only when it becomes a real opportunity. Lead and Deal remain separate records.
5. Deal enters New Deal and can move non-linearly by Drag & Drop.
6. Deal Activity completion may optionally update Deal Stage in the same save.
7. Deal without Next Activity is visibly warned in Pipeline.
8. Lost requires Lost Reason.
9. Closed Won remains system-controlled after Finance confirmation + Invoice.

## My Day
- New Lead count
- Action Today count
- Lead Overdue count
- No Activity count
- Day calendar
- Current-week calendar
- Complete and Reschedule directly from the calendar

## My Leads
- Search and attention filters
- Lead Detail
- Activity Timeline
- + Activity
- Create Deal

## My Pipeline
- Pipedrive-style horizontal Kanban
- Drag & Drop across non-linear Stages
- Stage count and value
- Package / license quantity on Deal Card
- Next Activity warning / status
- Mark as Lost drop target
- Closed Won locked for system flow
- Deal Detail and commercial edit

## Deal commercial facts
Real Deal data adds:
- Package
- License Quantity
- Software Value
- Hardware Value
- Total Deal Value
- Currency
- Expected Close Date
- Product / Commercial Note

## My Performance
Real server-side monthly snapshot:
- Monthly license target
- Closed Won license achievement
- Achievement rate and remaining licenses
- New Leads
- Lead → Deal conversion
- Won Deals
- Deal → Won conversion
- Completed / overdue Activities
- Won value by LAK / USD / THB

The QPOS BU default September 2026 target is seeded at 15 licenses. The target schema supports later owner-specific Sales Ops targets.

## My Commission
Commission projection uses the approved QPOS rates:
- Software: 5%
- Hardware: 1%

Statuses:
- Projected — open CRM Deal
- Pending — Closed Won but awaiting Finance confirmation in the commission ledger
- Confirmed — Finance-controlled
- Paid — Finance / Payroll-controlled
- Void — Closed Lost

CRM never lets Sales self-confirm or self-pay commission.

## Source-of-truth boundaries
Still intentionally external / system controlled:
- Quotation document → Quotation Tool
- Finance payment confirmation → Finance Tool
- Invoice upload → Finance Tool
- Closed Won → system only after Finance + Invoice
- Installation → Installation Tool
- Activation → Activation Tool
- Customer → Shared Customer Master

## Database
Migration: `20260912_004_crm_sales_workspace_full_function.sql`

Adds Deal commercial fields, `crm_sales_targets`, and `crm_commissions`.

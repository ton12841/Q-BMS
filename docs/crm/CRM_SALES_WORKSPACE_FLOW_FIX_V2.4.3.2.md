# Q BMS v2.4.3.2 — CRM Sales Workspace Flow Fix

## Purpose
Connect the CRM screens into the agreed Sales operating flow instead of treating Lead, Activity and Pipeline as disconnected pages.

## Canonical navigation
- My Day
- My Leads
- My Pipeline
- My Performance
- My Commission

`Activities` is no longer a main navigation page. Activities are actions attached to a Lead or Deal and surface in My Day plus the related record timeline.

## Lead → Deal flow
Lead remains separate from Deal.

1. Create Lead.
2. The new Lead opens immediately.
3. Sales can add `+ Activity` or `Create Deal`.
4. `Create Deal` converts the real Lead through the existing API and PostgreSQL transaction.
5. The resulting Deal enters `NEW_DEAL` and My Pipeline opens automatically.
6. The Deal card can be dragged between allowed non-linear stages.

## My Day
- Lead attention cards: New Lead, Action Today, Lead Overdue, No Activity.
- Cards open My Leads with the relevant filter.
- Activity Calendar has Day / Week views.
- Overdue Activity remains visible and must be Complete or Reschedule.

## My Leads
- Quick filters: All, New, Action Today, Overdue, No Activity.
- Direct row actions: Activity, Create Deal, Open.
- Lead Detail includes Activity Timeline.

## My Pipeline
- Pipedrive-style Drag & Drop from v2.4.3.1 remains intact.
- Empty Pipeline explains that only Deals appear and provides a shortcut to My Leads.
- Closed Won stays system-controlled.

## Performance / Commission
Navigation is installed now so the Sales workspace matches the agreed IA.
- My Performance shows a temporary Target vs Achievement preview until the target/license-quantity source is connected.
- My Commission is intentionally data-empty until Product/Order + Finance confirmation are connected; no fake commission is calculated.

## Database
No new migration is required for v2.4.3.2.

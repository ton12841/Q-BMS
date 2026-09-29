# Q BMS CRM v2.7.0.0 — Sales Ops Workspace Full Function

## Scope
This patch adds the first full Sales Ops operating workspace inside the CRM Tool while preserving the existing personal Sales workspace.

### Sales Ops navigation
- Overview
- Lead Database
- Pipeline
- Activities
- Performance
- Commission
- Sales Setup

### Shared CRM data behavior
The CRM list APIs now accept an explicit data scope:
- `SELF` — personal Sales workspace
- `SHARED` — shared BU view, only when the CRM Tool role has the matching shared-view capability
- `AUTO` — backward-compatible behavior for existing callers

This prevents a Sales Ops role from accidentally turning `My Leads` / `My Pipeline` into a team-wide view.

### Lead Database
- Shared BU Lead database
- Search from the main CRM search box
- Owner and status filters
- Assign / reassign / unassign Lead Owner
- Assignment is limited to active CRM BU members
- Converted/Lost Leads are assignment-locked
- CSV import up to 500 rows
- Imported Leads start Unassigned by default
- `owner_email` can auto-assign to an active CRM member
- Assignment actions write to the existing audit log

CSV required columns:
- `store_name`
- `primary_contact`
- `phone`
- `province`

Optional columns:
- `email`
- `whatsapp`
- `source`
- `source_detail`
- `owner_email`

### Pipeline
- BU-wide stage board
- Stage count and multi-currency value summary
- Owner visibility
- Next Activity health indicator
- Closed Won remains system-controlled after Finance confirmation + Invoice

### Activities
- Team activity table
- Owner filter
- Today / Overdue / Scheduled / Completed filters

### Performance
- Sales Owner operational scorecard
- SW Point Target reads from CRM BU Settings
- Actual SW/HW Point intentionally remains Pending until Deal Product Lines + Point Recognition are implemented
- No license count is misrepresented as SW Point

### Commission
- Uses the CRM Point/Commission Settings model as the canonical rule display
- Supports BU / Team / Individual plan precedence display
- Shows QPOS final-tier SW rates and fixed HW rate from settings
- Does NOT present the old Software 5% / Hardware 1% formula as canonical
- Actual commission remains Pending until Point Recognition exists

### Sales Setup
Embeds the existing CRM BU Settings, including:
- General
- Members
- Sales Teams
- Roles & Access
- Pipeline
- Point Settings
- Sales Target
- Commission Settings

Point Settings continues to use the v2.6.1 Product Selector foundation. Product remains a controlled searchable selection source, ready to switch to Product Master later.

## Architecture boundaries
This patch does not create or modify Product Master, Inventory, Employee, HR, Finance, Installation or Activation modules.

- CRM owns Lead / Deal / Activity / CRM settings.
- Employee/Organization remains BMS Core source of identity.
- Product Master will later replace the temporary CRM Product Source.
- Inventory will remain source of truth for hardware stock.
- Finance remains source of truth for payment confirmation and invoice.

## Database
No migration is required for v2.7.0.0. Lead assignment uses existing `crm_leads.owner_user_id`, CRM memberships, and `audit_logs`.

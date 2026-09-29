# Q BMS v2.6.0.0 — CRM BU Access + Settings Full Function

## Purpose
This version makes CRM behave as an independent Q BMS Tool. Q BMS Core remains the source of Employee/User identity and Business Units; CRM owns its own BU membership, Tool roles, sales teams, pipeline settings and commercial settings.

The patch intentionally does **not** implement the future BMS Tool Access Request / email approval / provisioning workflow. That platform workflow will be connected after the Employee foundation is stable. CRM is structured so it can plug into that outer gate without rebuilding CRM data.

## CRM access model
A single Q BMS User can belong to multiple CRM Business Units and can hold multiple CRM roles in each CRM BU.

Default CRM roles:
- CRM BU Admin — BU scope, level 4; CRM settings/member/team/commercial configuration.
- Sales Ops — BU scope, level 3; shared operational visibility capabilities and settings view.
- Sales Manager — Team scope, level 3.
- Sales — Self scope, level 2.
- Lead Contributor — BU lead intake capability.
- Viewer — BU read-only capability.

CRM membership is effective-dated. Expired, future or inactive membership does not become current Tool access. Until BMS Tool Access provisioning is connected, users with no CRM membership retain the existing Employee-Organization BU fallback so the current CRM is not unexpectedly locked out.

## CRM BU Settings UI
Authorized users get a `CRM BU Settings` tab with:
1. General — currency, timezone, default monthly SW Point target.
2. Members — assign/edit CRM BU membership, multiple roles, multiple sales teams and effective dates.
3. Sales Teams — create/edit CRM-only sales teams without touching HR Department/Organization.
4. Roles & Access — inspect role access level, data scope and capabilities.
5. Pipeline — configure stage labels/order/enablement; Closed Won remains system-controlled.
6. Point Settings — monthly integer SW/HW point per product.
7. Sales Target — BU/Team/Individual monthly SW Point target and optional software revenue target.
8. Commission Settings — BU/Team/Individual monthly commission plan.

## Target precedence
Target records support this precedence for the future recognition engine:
`Individual override > Sales Team > BU Default`.

QPOS September 2026 is seeded with a BU default of 30 SW Point. Hardware Point stays separate from SW Target achievement.

## Point period behavior
Point rules are period-stamped. Past months are locked according to the CRM BU timezone. Current/future months are editable.

For QPOS, the following product references are seeded for September 2026, but numeric points intentionally start at 0 because the supplied GS reference did not expose point values:
- PRD-0001 QPOS Handheld — Software / License / Year
- PRD-0002 QPOS QSR — Software / License / Year
- PRD-0003 QPOS FSR — Software / License / Year
- PRD-0004 QPOS Buffet — Software / License / Year
- PRD-0005 SUNMI P2 — Hardware / Unit
- PRD-0006 SUNMI V3E — Hardware / Unit
- PRD-0007 SUNMI D3 Single Screen — Hardware / Unit
- PRD-0008 SUNMI D3 Dual Screen — Hardware / Unit
- PRD-0009 Printer — Hardware / Unit
- PRD-0010 Cash Drawer — Hardware / Unit

When a later month has not yet been stamped, the latest point rules are presented as a template. Saving stamps the selected month rather than editing the historical source month.

## QPOS commission canonical seed
QPOS September 2026 BU Default plan is seeded as `SW_FINAL_TIER_HW_FIXED`:
- Base, 0–29 SW Point: 100,000 LAK / SW Point
- Tier 1, 30–35: 130,000 LAK / SW Point
- Tier 2, 36–44: 150,000 LAK / SW Point
- Tier 3, 45–59: 180,000 LAK / SW Point
- Tier 4, 60+: 200,000 LAK / SW Point
- Hardware: 25,000 LAK / HW Point

Software commission is non-progressive: the final monthly tier rate applies to every SW Point in that month. Example: 38 × 150,000 = 5,700,000 LAK.

Commission plans can be stamped at BU, Team or Individual scope with precedence:
`Individual override > Sales Team > BU Default`.

Later months can inherit the latest plan as an on-screen template and become a new stamped plan when saved. Historical months cannot be edited through the CRM API.

## Security / audit
The patch registers fine-grained CRM setting permissions in the Q BMS permissions catalog and also enforces CRM Tool capabilities in the service layer. Sensitive mutations are audit logged:
- CRM BU general settings
- CRM member/role/team assignment
- Sales team configuration
- Pipeline settings
- Point rules
- Sales targets
- Commission plans

This is deliberately a two-layer design: the current Q BMS permission middleware remains the outer authenticated Tool gate; CRM Tool membership/roles/capabilities enforce CRM-internal scope. Future BMS Request/Approval will provision the outer Tool access and then CRM membership/role.

## Compatibility and deliberate boundary
This patch builds the settings/access foundation only. It does not yet replace the existing v2.5 personal `My Performance` / `My Commission` calculation engine. Point recognition must be connected to actual Closed Won Deal/Product facts, and HW commission requires itemized hardware quantities; those should not be guessed from aggregate Hardware Value.

The next CRM integration should therefore use these settings as the source of truth for:
- Sales Ops / Management Workspace
- Lead Database assignment and team visibility
- Product/Deal item point recognition
- Closed Won SW/HW Point ledger
- Target vs Achievement
- Point/Tier Commission ledger

## Database additions
- `crm_bu_settings`
- `crm_role_definitions`
- `crm_bu_memberships`
- `crm_bu_membership_roles`
- `crm_sales_teams`
- `crm_sales_team_members`
- `crm_pipeline_stage_settings`
- `crm_point_rules`
- `crm_sales_point_targets`
- `crm_commission_plans`
- `crm_commission_tiers`

Migration: `database/migrations/20260912_005_crm_bu_access_settings.sql`

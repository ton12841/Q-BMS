# CRM v2.7.1.0 — Role-Based Unified Workspace Refactor

## Architecture standard
Q BMS Tools use one Tool structure, one data model and one workflow. User experience changes by Role + Permission + Data Scope + BU context.

CRM navigation is unified:
- Home
- Leads
- Pipeline
- Performance
- Commission
- Settings (permission-gated)

There is no separate Sales Ops tool/tab.

### Role-based rendering
- Sales / SELF: personal execution views — My Day, My Leads, My Pipeline, My Performance and My Commission.
- Sales Manager / TEAM: the same CRM pages rendered with team context.
- Sales Ops / BU: the same CRM pages rendered with BU-wide operational context.
- CRM BU Admin / elevated roles: shared CRM views plus permission-gated Settings.

### Server-side data scope
The API now resolves record visibility from the user's CRM role for the selected BU:
- SELF -> only records owned by the current user.
- TEAM -> only records owned by members sharing the user's CRM Sales Team(s).
- BU -> all permitted records inside the selected CRM BU, including unassigned Leads where applicable.

This filtering is enforced in the backend/repository rather than only hiding rows in the UI.

For non-global users, cross-BU `ALL` remains conservative; select a specific BU for Team/BU shared views.

### Activity and Settings
Team Activity control is embedded in Home rather than becoming another persona-specific tool/tab. Settings remains part of CRM and is shown only when the user has Settings permission.

### Product Point foundation
Product Point Settings remains a controlled Product selector abstraction prepared for Product Master and Inventory integration. CRM does not own Product Master.

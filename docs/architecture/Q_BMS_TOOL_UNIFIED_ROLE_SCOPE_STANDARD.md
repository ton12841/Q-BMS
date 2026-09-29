# Q BMS Tool Unified Role / Scope Standard

Version: v2.8.0.0

## Canonical rule

Every Q BMS Tool is one system with one navigation model, one data model, and one workflow model.
Users do not receive separate copies of a Tool for different job functions.
The experience changes through Role, Permission, Data Scope, BU Context, and permitted Actions.

## CRM reference implementation

Canonical CRM navigation:

- Home
- Leads
- Pipeline
- Activities
- Performance
- Commission
- Settings (permission controlled)

Role examples:

- Sales: SELF scope
- Sales Manager: TEAM scope
- Sales Ops: BU scope
- CRM BU Admin: BU scope + Settings
- Viewer: authorized read-only scope

The same Lead, Deal, Activity, Performance definition, and Commission definition is used for every role.
Only visibility and permitted actions change.

## QA Data Mode

Development / QA can preview another Role / Scope without changing stored membership.
Preview mode is read-only. Mutating APIs continue to enforce the actual authenticated user's permissions.

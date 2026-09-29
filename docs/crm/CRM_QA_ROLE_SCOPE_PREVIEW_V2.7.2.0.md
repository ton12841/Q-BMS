# CRM QA Role / Scope Preview — v2.7.2.0

## Goal
Provide a safe Development/QA-only selector to preview the same CRM Tool as different operating roles without changing stored CRM membership or role assignments.

## Preview roles
- Actual Access
- Sales — SELF
- Sales Manager — TEAM
- Sales Ops — BU
- CRM BU Admin — BU + Settings
- Viewer — BU read-only presentation

## Security rules
- The selector renders only in Development/QA (`NODE_ENV !== production`).
- Preview affects CRM presentation and read scope only.
- It never writes CRM membership, role, data scope, approval authority, or BMS access.
- Mutating APIs continue to enforce the authenticated user's real permissions.
- Production remains automatic Role + Permission + Data Scope + BU Context.

## Data scope behavior
- Sales preview sends `SELF`.
- Sales Manager preview sends `TEAM`.
- Sales Ops / CRM BU Admin / Viewer preview sends `BU`.
- Actual Access sends `AUTO`.
- Development preview backend explicitly respects `SELF`.
- Development TEAM preview uses the actor's configured CRM sales team; if no team is configured, it safely falls back to the actor only.
- BU preview may read the whole selected BU only in the Development Preview session.

## Architecture
This is a platform pattern for future Q BMS Tools:
One Tool / One Data Model / One Workflow / Different Experience by Role and Scope.

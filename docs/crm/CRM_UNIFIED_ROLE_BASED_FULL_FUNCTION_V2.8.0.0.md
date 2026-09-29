# CRM Unified Role-Based Full Function — v2.8.0.0

This patch consolidates CRM into the Q BMS Tool standard: one CRM, same pages, same objects, different Role / Scope experience.

## Included

- Unified navigation: Home, Leads, Pipeline, Activities, Performance, Commission, Settings.
- Activities becomes a first-class page for every role while Home keeps the daily / weekly execution view.
- SELF / TEAM / BU data scope continues to use the same Lead, Deal, and Activity model.
- QA Role / Scope Preview is explicitly read-only.
- Shared pages use scope-aware labels (Team or BU) instead of acting like a separate Sales Ops Tool.
- Personal Performance now uses the canonical SW Point Target from CRM Sales Target Settings.
- License quantity remains an operational metric only; it is not used as target achievement.
- Personal Commission no longer calculates or displays the legacy Software 5% / Hardware 1% model.
- Personal Commission resolves the effective Point Commission Plan using Individual Override -> Team -> BU precedence.
- Actual SW/HW Point and commission remain Pending until Deal Product Lines + Point Recognition are implemented.

## Dependencies intentionally deferred

- Product Master remains external / future Source of Truth.
- Inventory remains external / future Tool integration.
- Deal Product Lines and Point Recognition are not invented in CRM.
- No database migration is included.

## Security

- Branch must be feat-crm.
- QA preview does not grant real write authority.
- Backend mutating endpoints continue to enforce actual authenticated access.
- Employee / HR files are not touched.

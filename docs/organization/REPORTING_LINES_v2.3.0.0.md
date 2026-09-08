# Reporting Lines — v2.3.0.0

## Canonical model

`Employee Assignment -> reports to -> Employee Assignment`

A Manager is never inferred from Grade alone. The same Grade may report to different Managers.

## Relationship types

- `PRIMARY`: maximum one current line per Employee Assignment. Creating a new PRIMARY ends the previous current PRIMARY and preserves it in history.
- `DOTTED`: multiple current dotted lines are allowed.

## Safety rules

- No self-reporting.
- No reporting cycles.
- Current relationships cannot be duplicated.
- No hard delete. Use End Reporting Line.
- Future-dated changes are disabled in this foundation because the existing Employee Workspace resolves the open current row and does not yet resolve reporting state "as of" a future date.
- Department remains HOLD.

## Permissions

- `organization.reporting_lines.view`
- `organization.reporting_lines.manage`

Assigned to HR Admin and Super Admin.

## Audit actions

- `ORGANIZATION.REPORTING_LINE_CREATED`
- `ORGANIZATION.REPORTING_LINE_PRIMARY_CHANGED`
- `ORGANIZATION.REPORTING_LINE_ENDED`

## Route

`/organization/reporting-lines`


## v2.3.0.1 Installer Repair

The Reporting Lines feature remains the same as v2.3.0.0.

v2.3.0.1 fixes a patch-framework contradiction:
- v2.2.14.0 wrote `.qbms_last_patch_backup` at repository root.
- Architecture verification correctly treats root patch artifacts as obsolete.
- The repaired installer migrates the last-backup pointer into `.qbms_patch_backup/.last_backup`
  before verification and no longer recreates the obsolete root artifact.

The Reporting Lines database migration is idempotent and can be safely re-run
after the failed v2.3.0.0 installation attempt.

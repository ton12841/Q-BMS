# Q BMS v2.2.7.1 — Super Admin i18n Integration

## Bug

The Super Admin hierarchy introduced in v2.2.7.0 used hard-coded English and Thai text.
The global Language Switcher changed the Q BMS locale, but those new pages did not
read that locale, so the UI became mixed-language.

## Fix

The Super Admin hierarchy now uses the existing `useQBMSI18n` locale as its
single source of truth.

Supported:
- English (`en`)
- Lao (`lo`, with `la` compatibility)
- Thai (`th`)

Covered in this patch:
- Sidebar Super Admin label
- Super Admin Hub
- System Administration
- Roles & Permissions
- Module Management
- page titles / descriptions passed into the shared App Shell
- status labels and explanatory text on those hierarchy screens

No second language state is created.

## Architecture rule

All future Q BMS pages must consume the existing locale provider. New modules/tools
must not hard-code one language into the component when the text is user-facing.

## Scope

Frontend only.
No database migration.
No backend changes.
No npm install.

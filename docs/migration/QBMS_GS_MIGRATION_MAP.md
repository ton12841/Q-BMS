# Q BMS Google Apps Script -> Q BMS v2 Migration Map

CRM is intentionally excluded from this migration phase.

| Legacy Q BMS Area | Q BMS v2 Destination | Action |
|---|---|---|
| Login / Bootstrap | Core / Auth | REFACTOR |
| Session | Core / Session | REFACTOR |
| Permission checks | Core / Permission | REFACTOR |
| Employee records | Module / Employee | MIGRATE + NORMALIZE |
| Department / BU / Position / Manager | Module / Organization | MIGRATE + NORMALIZE |
| Employee Profile | Employee Workspace / Profile | MIGRATE |
| Employee employment view | Employee Workspace / Employment | MIGRATE |
| Create Employee | Tool / HRM / Employee / New Employee | MIGRATE |
| Existing Employee | Tool / HRM / Employee / Existing Employee | MIGRATE |
| Invitation | Tool / HRM / Invitation | MIGRATE |
| Employee Onboarding | Tool / HRM / Onboarding + Employee Workspace | SPLIT |
| HR Review | Tool / HRM / Onboarding | MIGRATE |
| Admin / Asset handoff | Module / Asset + HRM workflow | SPLIT |
| Employee Activation | Tool / HRM / Employee lifecycle | MIGRATE |
| Super Admin | Tool / Super Admin | MIGRATE |
| Roles & Permissions | Core / Permission + Super Admin UI | SPLIT |
| QA Test Employee | QA / Test Employee | MIGRATE |
| User Test / Preview As | QA / Preview As | REFACTOR |
| Apps Script `google.script.run` | REST API calls | DROP / REWRITE |
| `SpreadsheetApp` persistence | PostgreSQL repositories | DROP / REWRITE |
| Apps Script Cache / Properties session | Server session/token strategy | DROP / REWRITE |
| Monolithic `Scripts.html` | Next.js feature components/hooks | DROP / REWRITE |
| Monolithic `Styles.html` | Tailwind + shared components | DROP / REWRITE |

## Migration Order

1. Core foundation
2. Employee + Organization modules
3. Employee Workspace
4. HRM
5. Super Admin
6. QA
7. Remaining modules/tools only after the Q BMS baseline is stable

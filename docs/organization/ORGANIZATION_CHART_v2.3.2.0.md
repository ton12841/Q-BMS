# Q BMS v2.3.2.0 — Organization Chart & Employee Read-Only View

## Ownership

HR owns Employee Organization data.

HR manages:
- Business Unit
- Position
- Job Grade
- Job Level (derived from Grade)
- Primary Manager
- Dotted Manager
- Effective Date
- Assignment transition / history

Employees do not edit Organization data.

## Organization Chart

The chart is generated automatically from:

`Current Employee Assignment + Current Reporting Lines`

There is no separate manual chart editor.

Primary Reporting Lines are the solid hierarchy tree.
Dotted Reporting Lines are visualized as dashed connections.

## Access

Permission:

`organization.chart.view`

Granted to:
- EMPLOYEE
- HR_EMPLOYEE_ADMIN
- SUPER_ADMIN

The API and UI are read-only.

## Visibility

Chart includes:
- ACTIVE Employees
- Current primary Employee Assignment
- Current PRIMARY / DOTTED Reporting Lines
- Real Business Unit / Position / Grade / Level

QA test employees are excluded.

Department remains HOLD.

## Employee Workspace

Employees get an Organization Chart entry that opens:

`/organization/chart`

Search, Business Unit filter, zoom, expand/collapse and employee detail are read-only.

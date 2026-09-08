# Module / Organization

Status: FOUNDATION ACTIVE

Implemented:
- Business Unit
- 6 Job Levels / 14 Job Grades
- Job Family
- Global Position Master
- Position ↔ multiple Job Grades
- Employee Assignment
- Reporting Lines Management
  - PRIMARY Manager
  - DOTTED Manager
  - Effective dates
  - History / no hard delete
  - Cycle detection
  - Audit Log

Access:
- Organization master read: `organization.master.view`
- Organization master mutation: `organization.master.manage`
- Reporting Lines read: `organization.reporting_lines.view`
- Reporting Lines mutation: `organization.reporting_lines.manage`

`HR_EMPLOYEE_ADMIN` receives Reporting Lines view/manage. `SUPER_ADMIN` receives both for governance.

Department remains **HOLD**. Its schema is reserved for compatibility, but Department API/UI/business logic is intentionally disabled.

Reporting Lines use Employee Assignment as the source of truth. Grade is never used alone to infer the Manager.

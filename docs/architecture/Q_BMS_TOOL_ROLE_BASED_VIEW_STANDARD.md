# Q BMS Tool Role-Based View Standard

Canonical platform rule from v2.7.1.0 onward:

**One Tool — One Core — Different Experience by Role & Scope.**

Every Q BMS Tool should keep one navigation architecture, one source of truth, one data model and one workflow. Do not create separate duplicate tools or duplicate business logic for Sales, Sales Ops, Manager, Admin or Viewer personas.

The rendered experience is determined by:
- Business Unit context
- Tool membership
- Role(s)
- Permission / capability
- Data Scope: Self / Team / BU / Multiple BU / All
- Individual override where supported

Data Scope is a security rule, not only a UI filter. A Tool must enforce scope server-side whenever it reads or mutates protected business data.

Examples:
- Sales: the CRM pages render personal execution with Self scope.
- Sales Manager: the same CRM pages render team execution with Team scope.
- Sales Ops: the same CRM pages render BU operations with BU scope.
- CRM BU Admin: the same CRM pages plus permission-gated Settings.

Settings are part of the Tool, not a separate Admin Tool. Sensitive configuration must be permission-gated and auditable.

Cross-tool integrations should use shared IDs / APIs / events. A Tool must not duplicate another Tool's source-of-truth master data.

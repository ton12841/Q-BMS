# Q BMS v2.4.2.0 — CRM Sales Activity Engine

## Scope
This patch converts CRM Sales Activity from QA preview data to real PostgreSQL-backed records linked to real CRM Leads.

## Business rules implemented
- Activity Types: Call, Visit, Meeting, Demo, Follow-up, Quotation, Contract, Payment Follow-up.
- Activities are linked to a real Lead and inherit its Business Unit.
- Sales can Schedule, Complete, or Reschedule an Activity.
- Overdue is derived from an active Activity whose scheduled time has passed.
- Complete requires Activity-specific Outcome plus Result / Discussion.
- Complete may create the Next Activity atomically.
- Reschedule requires a new future schedule and Reason.
- Lead Next Activity is derived from the earliest active Activity; it is not duplicated as manually editable Lead data.
- My Day Today / Overdue / No Next Activity use real Lead and Activity data.
- Activity history and Q BMS Audit Log are written for create / complete / reschedule.
- Deal Pipeline remains QA preview data in this version.

## Source of truth
CRM owns Lead and Sales Activity. Quotation, Finance, Installation and Activation remain separate Tools / Modules and are not implemented by this patch.

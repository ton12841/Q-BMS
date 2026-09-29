# Q BMS CRM v2.4.2.1 — Activity Purpose Dropdown

## Change
Sales no longer types a free-text Subject when scheduling a Sales Activity.

Each Activity Type exposes a controlled Purpose list. `Other` opens a required `Specify Purpose` field. `Note` remains optional.

The same Purpose behavior is used when creating a Next Activity after completion.

## Data model
- `purpose_code` is analytics-friendly and language-neutral.
- `purpose_detail` is only required for `OTHER`.
- Existing v2.4.2.0 free-text subjects are preserved by migrating them to `OTHER` + `purpose_detail`.
- The legacy `subject` database column remains temporarily for compatibility; new UI/API behavior is Purpose-first.

## Purpose sets
- Call: First Contact, Follow-up, Product Introduction, Price Follow-up, Appointment, Payment Follow-up, Other
- Visit: First Visit, Store Survey, Follow-up, Product Presentation, Relationship Visit, Other
- Meeting: Requirement Discussion, Solution Discussion, Pricing, Commercial Discussion, Contract Discussion, Other
- Demo: Product Demo, QSR Demo, FSR Demo, Handheld Demo, Feature Demo, Re-Demo, Other
- Follow-up: After Call, After Visit, After Demo, After Quotation, After Meeting, Customer Decision, Other
- Quotation: Prepare Quotation, Send Quotation, Revise Quotation, Quotation Follow-up, Other
- Contract: Prepare Contract, Send Contract, Contract Revision, Signature Follow-up, Other
- Payment Follow-up: Payment Reminder, Payment Confirmation, Payment Issue, Payment Slip Follow-up, Other

# Q BMS CRM Foundation v1

## Purpose
Build one shared CRM for Q BMS. QPOS is the first BU using it, but the CRM must support other Business Units without duplicating the tool.

## Canonical ownership
- CRM: Lead, Deal, Activity, Pipeline, Stage History.
- Customer Master: customer identity after commercial conversion.
- Product Master: product code, product name, BU, standard price, warranty metadata.
- Quotation Tool: quotation creation, running QT number, version/document and CRM linkage.
- Financial Module: payment slip review, payment confirmation and invoice upload/link.
- Installation Tool: installation request, scheduling, completion.
- Subscription / QPOS backend: software activation and license lifecycle.

## CRM v1 business rules
- Lead source: Event, Facebook, Website, Referral, Partner, Walk-in, Outbound, Import, Other, Own Lead.
- Sales can create Own Lead. Sales Ops can create and assign. Marketing leads enter an unassigned pool for Sales Ops assignment.
- Lead creation minimum: Store Name, Contact Name, Phone, Province, Source. Email and WhatsApp are optional.
- Lost needs a reason. Follow-up is not Hold; it must have a reason and schedule.
- Sales sees own leads; Sales Ops sees team + unassigned pool; Management visibility follows role/permission.
- Activity types: Call, Visit, Meeting, Demo, Follow-up, Quotation, Contract, Payment Follow-up.
- Overdue items require Complete or Reschedule. Active Deal without Next Activity is Needs Attention.
- Performance / target / point / commission remain outside My Day.
- Pipeline stages are not sequential. Sales may skip stages based on real events.
- Entering Quotation requires a quotation created in Quotation Tool and linked back with QT number/document.
- Customer Confirm enables Payment stage. Sales uploads payment slip after payment.
- Slip and quotation are sent to Finance. Finance confirms payment, creates invoice externally for v1, uploads invoice, and links it back to Sales.
- Closed Won is system-controlled after Finance confirms payment and returns the invoice.
- Sales can then request installation using invoice/commercial evidence.
- Installation completes in Installation Tool; software activation follows completion.

## Multi-BU foundation
- Lead and Deal: BU required; Project optional; Campaign optional.
- Activity inherits BU context.
- Customer Master is global/shared, with BU/project relationships instead of duplicate customer databases.
- Employee data visibility is controlled by Role/Permission, not only employee primary BU.
- Product has Product Code and BU; product search only shows products for the active BU.
- Document numbers run continuously by document type, not reset by BU.

## Customer identity
Keep separate concepts for:
- Store / Trading Name
- Legal Company Name
- Individual Name
- Primary Contact

The first CRM version uses one Primary Contact. Multi-contact / branch-contact complexity is deferred.

## Language
Q BMS CRM is i18n-ready for Lao, English and Thai. Database/status codes stay language-neutral. User-entered notes are not auto-translated. Document language is independent from UI language.

# Q BMS CRM v2.4.3.0 — Real Deal + Pipeline Foundation

## Scope
This phase moves Deal and Pipeline from QA preview data to PostgreSQL-backed CRM records.

### Real business flow
- Lead stays separate from Deal.
- Sales explicitly converts an active Lead to a Deal.
- One Lead can create one initial Deal in this v1 conversion flow.
- Active future Lead Activities move to the new Deal automatically so Sales does not lose scheduled work.
- Completed Lead Activities stay with Lead history.
- Deal Pipeline is non-linear. Sales may move between active stages based on the real commercial state.
- Stage history is recorded from the first `NEW_DEAL` state.

### Deal stages
- `NEW_DEAL`
- `DEMO`
- `QUOTATION`
- `NEGOTIATION`
- `CONTRACT`
- `AWAITING_PAYMENT`
- `CLOSED_WON`
- `CLOSED_LOST`

### Commercial gates
- `QUOTATION` requires a linked Quotation. Quotation remains a separate Tool / Source of Truth.
- `AWAITING_PAYMENT` requires a linked and customer-confirmed Quotation.
- `CLOSED_WON` cannot be selected manually. It remains system-controlled for the later Finance Payment Confirm + Invoice return flow.
- `CLOSED_LOST` requires a Lost Reason.

### Activity continuity
Activities can now belong to either exactly one Lead or exactly one Deal.
- New work cannot be scheduled on a converted Lead; schedule it on the Deal.
- Closed Deals do not accept new Sales Activities.
- Complete + Next Activity keeps the same Lead/Deal relationship.

### Source of Truth boundaries
This patch does not create Quotation, Finance, Installation or Activation logic. It only reserves relationship fields needed for later integration and enforces the agreed gates.

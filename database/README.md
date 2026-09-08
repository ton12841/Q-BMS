# Q BMS PostgreSQL

Database migration is intentionally separated from Google Apps Script migration.

## Planned shared table groups

- users / roles / permissions
- employees
- organizations / business_units / departments / positions
- customers / customer_contacts / customer_sites
- products / product_categories
- suppliers
- locations
- assets
- documents
- tasks / approvals
- notifications

## Planned tool table groups

- hrm_*
- crm_* (HOLD)
- inventory_*
- installation_*
- financial_*
- procurement_*

Every schema change must be versioned through migrations.

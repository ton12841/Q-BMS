# Code Ownership Rules

1. A Tool must not directly query another Tool's tables.
2. Shared master data belongs to Modules.
3. A Tool references shared Modules by ID and service/API contract.
4. UI components shared by multiple areas belong in `components/`.
5. Business rules belong in backend Services, not Controllers or frontend pages.
6. SQL belongs in Repository/Data Access only.
7. Controllers handle HTTP concerns only.
8. Every data migration must be versioned.
9. CRM remains reserved until explicitly opened for migration.

# Core / Permission

Status: FOUNDATION ACTIVE

Canonical implementation is split across:

- `core/access-control` — effective access and Level / Grade policy
- `core/role-management` — Role catalog and membership
- `core/permission-management` — Permission catalog

Permission is an atomic capability. Role is a bundle. Employee effective access is Role + Organization Policy, with Grade overriding Level only inside the Organization Policy layer.

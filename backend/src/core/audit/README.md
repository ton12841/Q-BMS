# Core / Audit

Status: FOUNDATION ACTIVE

Canonical implementation lives under `backend/src/core/audit-log/`.

Audit Log is a Core Platform capability. Business domains write auditable events through their workflow/services; the Super Admin Audit Log is read-only and sanitizes sensitive metadata before delivery.

# Q BMS Migration Status — v2.3.0.1

## Core Platform

- [x] Authentication / Google Workspace SSO
- [x] Session foundation
- [x] Role / Permission access engine
- [x] Level / Grade permission policy
- [x] User Access Assignment
- [x] Effective Permission Preview
- [x] User & Identity Management foundation
- [x] Audit Log foundation
- [x] Role Management foundation
- [x] Permission Management foundation
- [x] Module Management foundation
- [x] System Configuration foundation
- [x] Platform Diagnostics foundation
- [x] English / Lao / Thai Super Admin integration

## Shared Modules

- [x] Employee Master foundation
- [x] Employee Assignment foundation
- [x] Organization: Business Unit
- [x] Organization: 6 Job Levels / 14 Job Grades
- [x] Organization: Job Family
- [x] Organization: Position + multi-Grade mapping
- [x] Organization: Reporting Lines — PRIMARY / DOTTED, cycle detection, history, audit and management UI/API
- [HOLD] Department — schema reserved, API/UI disabled
- [~] Asset — master/assignment service foundation used by HRM onboarding
- [~] Notification — event/target foundation used by workflows
- [~] Document — employee document foundation only
- [ ] Customer
- [ ] Product
- [ ] Supplier / Vendor
- [ ] Location / Site
- [ ] Task & Approval shared module

## Employee / HRM Flow

- [x] HR Create Employee
- [x] IT Account Setup workflow
- [x] HR Invitation workflow
- [x] Google Login / Identity Linking
- [x] Employee Self-Onboarding
- [x] HR Review
- [x] Asset Gate
- [x] Employee Activation
- [x] Employee Workspace foundation
- [x] Onboarding E2E QA foundation
- [ ] Attendance
- [ ] Leave
- [ ] KPI / Performance
- [ ] Employee Tasks / Requests

## Business Tools

- [~] HRM — onboarding lifecycle foundation active
- [ ] Inventory
- [ ] Installation
- [ ] Procurement
- [ ] Financial
- [ ] Management Dashboard
- [HOLD] CRM migration

## v2.2.14.0 Hardening

- [x] Organization read/write API permissions
- [x] Department API exposure removed while HOLD
- [x] Development Preview restricted to local machine
- [x] Self-onboarding/HRM employee identifiers aligned to BIGINT
- [x] Foreign-key integrity added with orphan preflight
- [x] Canonical Onboarding State Resolver
- [x] Employee Workspace manager resolution prefers Reporting Lines
- [x] HRM Onboarding Review no longer imports Employee repository directly
- [x] Dependency versions pinned
- [x] Repository hygiene / `.gitignore` / `.env.example`
- [x] Source version metadata synchronized
- [x] Architecture guard + unit tests added
- [x] CI verification workflow added

## Next

1. Load real iQuri Position Master data.
2. Run real Employee Onboarding E2E using the completed Organization structure and Reporting Lines.
3. Complete Employee Master / Organization Assignment operating UX where needed.
4. Continue HRM Employee Management / Attendance / Leave / KPI.

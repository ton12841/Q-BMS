# Q BMS v2.3.5.0 — Organization Interactive QA Workspace

Fixes the problem where every Organization sub-page opened the same generic QA preview.

QA now has separate views for:
- Overview
- Business Unit — Create/Edit/Delete sample
- Level / Grade — Create/Edit/Delete sample
- Position + Job Family — Create/Edit/Delete sample
- Reporting Lines — Create/Edit/Delete sample
- Organization Chart — read-only / auto-generated

All QA writes are browser-local React state only. No backend API or PostgreSQL write.

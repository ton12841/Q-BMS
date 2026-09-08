# Organization / Position Data Model — v2.0.8.0

## Current relationship

```text
Business Unit ─────┐
                   ├── Position ── Job Grade ── Job Level
Department (HOLD) ─┘  [reserved, optional for now]
```

## Rules

- `positions.business_unit_id` identifies the business scope of a position.
- `positions.job_grade_id` is the canonical job-structure mapping.
- Job Level is **derived from Job Grade** and is not duplicated in the new model.
- `positions.department_id` remains in the schema but is nullable while Department is on HOLD.
- Legacy `positions.job_level` remains temporarily for backward compatibility; new code must not use it as the source of truth.
- Position UI is view-only in this foundation phase.
- Position translations use `position_translations` for EN / TH / LO.

## Why this model

It prevents a Position from carrying a free-text Job Level that can disagree with the Grade master, while keeping Department reserved for later without blocking Organization development now.

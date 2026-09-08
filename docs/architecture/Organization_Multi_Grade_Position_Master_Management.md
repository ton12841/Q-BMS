
# Q BMS v2.0.9.3 — Multi-Grade Position Master Management

This version makes the revised Position architecture maintainable in the UI.

## Final Position relationship

```text
Job Family
    ↓
Position
    ↕
Allowed Job Grades (one or many)
    ↓
Job Level (derived)
```

Business Unit is intentionally not stored as part of the Position identity.

The Employee / Employment assignment will later combine:

```text
Employee
├── Business Unit
├── Position
└── Job Grade
      └── Job Level (derived)
```

## Example

```text
Job Family: Sales

Position: Sales Manager
Allowed Grades:
- Grade 7
- Grade 8
```

The Position is created once.

Later:

```text
Employee A
Business Unit: QPOS
Position: Sales Manager
Grade: 8

Employee B
Business Unit: iQuri
Position: Sales Manager
Grade: 7
```

## Position master fields

- Position Code — required, unique
- Job Family — required
- Allowed Job Grades — one or many, required
- Job Level — never entered manually; derived from Grade
- Status — Active / Inactive
- Sort Order
- English Name — required source language
- Thai Name — optional translation
- Lao Name — optional translation
- Description EN / TH / LO — optional

## API

```text
GET  /api/organization/positions
GET  /api/organization/positions/:id
POST /api/organization/positions
PUT  /api/organization/positions/:id
```

No hard delete is exposed. Use Inactive.

Department remains reserved and on HOLD.

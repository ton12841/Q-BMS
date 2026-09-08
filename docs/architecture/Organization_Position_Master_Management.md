
# Q BMS v2.0.9.0 — Position Master Management

## Purpose
Turn the Position foundation into usable Organization master data.

## Data relationship

Business Unit → Position → Job Grade → Job Level

- A Position must select one Business Unit.
- A Position must select one Job Grade.
- Job Level is not entered independently. It is derived from the selected Job Grade.
- Department stays reserved and is not required while the Department module is on HOLD.

## Position fields
- Position Code — required, globally unique
- Business Unit — required
- Job Grade — required
- Job Level — derived
- Status — Active / Inactive
- Sort Order
- English Name — required source language
- Thai Name — optional translation
- Lao Name — optional translation
- Descriptions in EN / TH / LO — optional

## Write behavior
- Create: POST /api/organization/positions
- Detail: GET /api/organization/positions/:id
- Update: PUT /api/organization/positions/:id
- No hard delete. Use INACTIVE for positions that should no longer be assigned.

## Localization
English remains the source/fallback. Thai and Lao position translations are stored in
`position_translations`. Clearing an optional Thai/Lao name removes that translation and
the UI falls back to English.

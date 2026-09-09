# Q BMS v2.3.3.3 — Typography Verify Repair

## Root cause

v2.3.3.2 intentionally increased the Q BMS typography scale, but
`verify_architecture.mjs` still asserted the exact older v2.3.3.1 pixel values.
The patch therefore contradicted its own verifier and rolled runtime files back.

## Repair

- Keeps the intended readability scale from v2.3.3.2.
- Changes Architecture Verification to validate the typography token contract
  (token names exist) instead of hard-coding visual pixel values.
- This prevents future design-only typography tuning from being treated as an
  architecture defect.
- Synchronizes version to v2.3.3.3.
- No database migration.

Current readability scale:
- Caption 12px
- Meta 13px
- Small 14px
- Body 15px
- Card title 17px
- Section title 19px
- Page title 24px
- Display 30px

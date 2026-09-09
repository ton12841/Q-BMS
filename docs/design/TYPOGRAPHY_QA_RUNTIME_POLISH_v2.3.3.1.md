# Q BMS v2.3.3.1 — QA Runtime & Typography Polish

## Runtime fix
QA Data Mode now treats AbortError caused by React Strict Mode, navigation and Next.js Fast Refresh as expected cleanup instead of an unhandled runtime error.

## Typography baseline
The shared Q BMS typography scale was raised for desktop readability:
- Caption 11px
- Meta 12px
- Small 13px
- Body 14px
- Card Title 16px
- Section Title 18px
- Page Title 22px
- Display 28px

QA Data Mode and the in-module QA switch also receive targeted font-size increases because those components used smaller hard-coded values.

No business data, API behavior or database schema changes are included.


# Q BMS v2.0.9.2 — Job Family Master Management

This version makes Job Family a real maintainable Organization master.

## Purpose

Job Family is a grouping layer above Position.

Example:

```text
Job Family: Sales

Positions:
- Sales Executive
- Senior Sales Executive
- Sales Manager
- Senior Sales Manager
- Head of Sales
```

Job Family is not a Job Grade, Job Level, Department or Business Unit.

## Management rules

- Job Family Code is globally unique.
- English Name is the source / fallback language.
- Thai and Lao are optional controlled translations.
- Status is Active / Inactive.
- No hard delete is provided.
- Existing Positions can count how many records use each Job Family.
- Department remains on HOLD.

## API

```text
GET  /api/organization/job-families
GET  /api/organization/job-families/:id
POST /api/organization/job-families
PUT  /api/organization/job-families/:id
```

## UI

```text
/organization/job-families
```

The Position page links to Job Family management.

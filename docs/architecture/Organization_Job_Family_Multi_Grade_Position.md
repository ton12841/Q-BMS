
# Q BMS Organization — Revised Job Family / Position Architecture

Version: v2.0.9.1

## Why this revision exists

The v2.0.8.0 Position foundation assumed one Position maps to one Job Grade.
That is too restrictive for a real organization.

A title such as `Sales Manager` may be valid at more than one Grade.
Different Grades may also belong to different Job Levels.

Q BMS therefore uses the following model:

```text
Job Family
    ↓
Position
    ↕
Allowed Job Grades
    ↓
Job Level (derived from each Grade)
```

Business Unit is not part of the Position identity in the revised model.

```text
Employee / Employment Assignment
├── Business Unit
├── Position
└── Job Grade
      └── Job Level (derived)
```

This prevents duplicating the same Position for every Business Unit.

## Example

```text
Job Family: Sales

Sales Executive
Allowed Grades: 11, 12

Senior Sales Executive
Allowed Grades: 10

Sales Manager
Allowed Grades: 7, 8

Senior Sales Manager
Allowed Grades: 6

Head of Sales
Allowed Grades: 5
```

An employee can then be assigned:

```text
Employee A
Business Unit: QPOS
Position: Sales Manager
Grade: 8
Level: Level III

Employee B
Business Unit: iQuri
Position: Sales Manager
Grade: 7
Level: Level II
```

The Position `Sales Manager` exists once.

## Database model

### job_families
Global Job Family master:
- code
- name
- description
- status
- sort_order

Localized names are stored in `job_family_translations`.

### positions
Position master:
- code
- name
- description
- job_family_id
- status
- sort_order

Existing `business_unit_id`, `job_grade_id`, and `department_id` columns are
preserved for backward compatibility but are not the target model.

### position_job_grades
Many-to-many relationship:
- position_id
- job_grade_id
- is_primary
- sort_order

Job Level is never manually mapped to Position because Job Grade already
determines Job Level.

## Department

Department remains reserved and on HOLD. It is not required by this architecture.

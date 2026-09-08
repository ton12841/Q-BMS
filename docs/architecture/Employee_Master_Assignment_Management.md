
# Q BMS v2.0.11.0 — Employee Master + Assignment Management

## Core principle

Employee remains the base identity.

```text
Employee
    ↓
Employee Assignment
    ├── Business Unit
    ├── Position
    └── Job Grade
          ↓
       Job Level (derived)
```

Permission, Department, Position and other capabilities do not replace the Employee identity.

## Current Employee Master fields

Identity:
- Employee Code
- Company Email
- First Name
- Last Name
- Nickname

Employment:
- Employment Type
- Employee Status
- Employee Record Type
- Work Location
- Start Date
- Probation Days
- Probation End Date
- Contract End Date
- HR Note

Current primary assignment:
- Business Unit
- Position
- Job Grade
- Job Level derived automatically
- Assignment Effective From

## Position / Grade validation

The employee assignment references:

```text
position_job_grades(position_id, job_grade_id)
```

So the selected Grade must be allowed by the selected Position.

## Department

Department remains reserved / on HOLD and is not required by the Employee form.

## Current update behavior

The Employee Master editor updates the current active primary assignment in place.
This is suitable for initial master-data loading and correction.

A later HRM employment-change workflow will preserve assignment history by closing
the prior assignment and creating a new effective-dated assignment.

## Reporting Lines next

Because Employee Assignment now exists, Reporting Lines can safely connect:

```text
Employee Assignment
      ↓ reports to
Employee Assignment
```

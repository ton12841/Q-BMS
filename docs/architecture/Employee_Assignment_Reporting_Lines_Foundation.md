
# Q BMS — Employee Assignment & Reporting Lines Architecture

Version: v2.0.10.0

## Why this foundation is required

After revising Position to support multiple Job Grades, Employee cannot safely
store only a Position and a free-text Job Level.

The correct organizational assignment is:

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

Example:

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

## Grade validation

`employee_assignments` has a composite foreign key to:

```text
position_job_grades(position_id, job_grade_id)
```

So Q BMS cannot assign an employee to a Grade that the selected Position
does not allow.

Example:

```text
Sales Manager
Allowed Grades: 7, 8
```

Valid:
- Sales Manager + Grade 7
- Sales Manager + Grade 8

Invalid:
- Sales Manager + Grade 12

## Reporting Lines

Reporting Lines should not be stored only as:

```text
Position -> Position
```

because the same Position can exist in several Business Units and more than one
employee can hold the same Position.

Instead:

```text
Employee Assignment
       ↓
reports to
       ↓
Employee Assignment
```

Supported relationship types:

```text
PRIMARY
DOTTED
```

Rules:
- one current PRIMARY manager per active assignment
- DOTTED relationships can coexist
- an assignment cannot report to itself
- effective dates are supported
- cycle detection will be handled in the Reporting Lines service before writes

## Department

Department is still reserved and remains on HOLD.

A nullable `department_id` is kept on Employee Assignment so the architecture
will not need another redesign when Department is discussed later.

## Legacy employee fields

The original `employees` table still contains organization fields such as
`primary_business_unit_id`, `position_id`, `manager_employee_id`,
`department_id`, and `job_level`.

They are not dropped yet. The Employee Module will migrate to:

```text
employee_assignments
employee_reporting_lines
```

and legacy columns should only be retired after migration is verified.

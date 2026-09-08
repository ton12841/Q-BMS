# Q BMS — Organization Level / Grade Master

Canonical baseline for Q BMS organization hierarchy.

Department remains **HOLD**. Level / Grade is maintained independently and can be used by Position and Employee Assignment without requiring Department.

| Level | Grade | Position guideline |
|---|---:|---|
| Level 0 — Top Management | 1 | President |
| | 2 | Vice President |
| Level I — Executive Management (C-Level) | 3 | CEO |
| | 4 | C-Level |
| | 5 | Head of Department / Head of BU |
| Level II — Senior Management | 6 | Senior Manager |
| | 7 | Mid Level Manager |
| Level III — Junior Management | 8 | Junior Manager |
| | 9 | Team Leader / Supervisor / Assistant Secretary |
| Level IV — Senior Contributor | 10 | Specialist / Expert |
| | 11 | Senior Officer |
| Level V — Entry Level | 12 | Mid Level Officer |
| | 13 | Junior Officer / Housekeeper |
| | 14 | Intern |

## Experience / education guidance

These fields are **guidance for HR**, not hard validation rules.

Confirmed reference currently available:

- Grade 5 — 12+ years total experience; 5+ years management experience; Bachelor Degree.

No criteria are invented for the other grades. They remain blank until confirmed by HR.

## Relationship rules

- Grade belongs to exactly one Job Level.
- Position may support one or multiple Job Grades.
- Job Level shown on an Employee Assignment is derived from the selected Job Grade.
- Reporting Line is not inferred from Grade alone.
- Department remains reserved in the architecture but is not required in the current Web implementation.

-- Q BMS v2.0.5.0
-- Current company Job Level / Grade master.
-- Criteria are guidance/reference values, not hard validation rules.

INSERT INTO job_levels (
    code,
    name,
    description,
    status,
    sort_order
)
VALUES
    ('LEVEL_0', 'Top Management', 'Level 0', 'ACTIVE', 10),
    ('LEVEL_I', 'Executive Management (C-Level)', 'Level I', 'ACTIVE', 20),
    ('LEVEL_II', 'Senior Management', 'Level II', 'ACTIVE', 30),
    ('LEVEL_III', 'Junior Management', 'Level III', 'ACTIVE', 40),
    ('LEVEL_IV', 'Senior Contributor', 'Level IV', 'ACTIVE', 50),
    ('LEVEL_V', 'Entry Level', 'Level V', 'ACTIVE', 60)
ON CONFLICT (code)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO job_grades (
    job_level_id,
    grade_number,
    name,
    experience_requirement,
    education_requirement,
    description,
    status,
    sort_order
)
SELECT
    jl.id,
    v.grade_number,
    v.name,
    v.experience_requirement,
    v.education_requirement,
    v.description,
    'ACTIVE',
    v.sort_order
FROM (
    VALUES
        ('LEVEL_0',  1, 'President', 'N/A', 'N/A', NULL, 10),
        ('LEVEL_0',  2, 'Vice President', 'N/A', 'N/A', NULL, 20),

        ('LEVEL_I',  3, 'CEO', 'N/A', 'N/A', NULL, 30),
        ('LEVEL_I',  4, 'C-Level', 'N/A', 'N/A', NULL, 40),
        ('LEVEL_I',  5, 'Head of Department / Head of BU', '12+ years (5+ management)', 'Bachelor Degree', NULL, 50),

        ('LEVEL_II', 6, 'Senior Manager', '10+ years (4+ management)', 'Bachelor Degree', NULL, 60),
        ('LEVEL_II', 7, 'Mid Level Manager', '8+ years (3+ management)', 'Bachelor Degree', NULL, 70),

        ('LEVEL_III', 8, 'Junior Manager', '6+ years (2+ management)', 'Bachelor Degree', NULL, 80),
        ('LEVEL_III', 9, 'Team Leader / Supervisor / Assistant Secretary', '5+ years', 'Associate Degree', NULL, 90),

        ('LEVEL_IV', 10, 'Specialist / Expert', '4+ years', 'Associate Degree', NULL, 100),
        ('LEVEL_IV', 11, 'Senior Officer', '3+ years', 'Associate Degree', NULL, 110),

        ('LEVEL_V', 12, 'Mid Level Officer', '2+ years', 'Associate Degree', NULL, 120),
        ('LEVEL_V', 13, 'Junior Officer / Housekeeper', '0-1 year', 'Associate Degree', NULL, 130),
        ('LEVEL_V', 14, 'Intern', 'Fresh learner', 'Associate Degree', NULL, 140)
) AS v(
    level_code,
    grade_number,
    name,
    experience_requirement,
    education_requirement,
    description,
    sort_order
)
INNER JOIN job_levels jl
    ON jl.code = v.level_code
ON CONFLICT (grade_number)
DO UPDATE SET
    job_level_id = EXCLUDED.job_level_id,
    name = EXCLUDED.name,
    experience_requirement = EXCLUDED.experience_requirement,
    education_requirement = EXCLUDED.education_requirement,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

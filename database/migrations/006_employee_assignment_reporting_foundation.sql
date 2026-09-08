
-- Q BMS v2.0.10.0
-- Employee Assignment + Reporting Lines Foundation
--
-- Position is now a global master and may support multiple Grades.
-- Business Unit, Position and Grade therefore belong together at the
-- employee assignment level.
--
-- Reporting Lines reference employee assignments because the same Position
-- may exist in several Business Units or be held by more than one employee.

CREATE TABLE IF NOT EXISTS employee_assignments (
    id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(id) ON DELETE CASCADE,

    business_unit_id BIGINT NOT NULL
        REFERENCES business_units(id),

    position_id BIGINT NOT NULL
        REFERENCES positions(id),

    job_grade_id BIGINT NOT NULL
        REFERENCES job_grades(id),

    -- Reserved for Department. Department remains on HOLD.
    department_id BIGINT
        REFERENCES departments(id),

    is_primary BOOLEAN NOT NULL DEFAULT TRUE,

    assignment_status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            assignment_status IN (
                'FUTURE',
                'ACTIVE',
                'INACTIVE'
            )
        ),

    effective_from DATE,
    effective_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_employee_assignment_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        ),

    -- Ensures the employee can only use a Grade allowed by the Position.
    CONSTRAINT fk_employee_assignment_position_grade
        FOREIGN KEY (position_id, job_grade_id)
        REFERENCES position_job_grades (
            position_id,
            job_grade_id
        )
);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_employee_id
    ON employee_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_business_unit_id
    ON employee_assignments(business_unit_id);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_position_id
    ON employee_assignments(position_id);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_job_grade_id
    ON employee_assignments(job_grade_id);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_status
    ON employee_assignments(assignment_status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_active_primary_assignment
    ON employee_assignments(employee_id)
    WHERE
        is_primary = TRUE
        AND assignment_status = 'ACTIVE'
        AND effective_to IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_assignment_identity
    ON employee_assignments (
        employee_id,
        business_unit_id,
        position_id,
        job_grade_id,
        COALESCE(effective_from, DATE '1900-01-01')
    );

CREATE TABLE IF NOT EXISTS employee_reporting_lines (
    id BIGSERIAL PRIMARY KEY,

    employee_assignment_id BIGINT NOT NULL
        REFERENCES employee_assignments(id) ON DELETE CASCADE,

    reports_to_assignment_id BIGINT NOT NULL
        REFERENCES employee_assignments(id),

    relationship_type VARCHAR(30)
        NOT NULL DEFAULT 'PRIMARY'
        CHECK (
            relationship_type IN (
                'PRIMARY',
                'DOTTED'
            )
        ),

    status VARCHAR(30)
        NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE'
            )
        ),

    effective_from DATE,
    effective_to DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_reporting_line_not_self
        CHECK (
            employee_assignment_id
            <> reports_to_assignment_id
        ),

    CONSTRAINT chk_reporting_line_dates
        CHECK (
            effective_to IS NULL
            OR effective_from IS NULL
            OR effective_to >= effective_from
        )
);

CREATE INDEX IF NOT EXISTS idx_employee_reporting_lines_employee_assignment
    ON employee_reporting_lines(employee_assignment_id);

CREATE INDEX IF NOT EXISTS idx_employee_reporting_lines_manager_assignment
    ON employee_reporting_lines(reports_to_assignment_id);

CREATE INDEX IF NOT EXISTS idx_employee_reporting_lines_type_status
    ON employee_reporting_lines(relationship_type, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_current_primary_reporting_line
    ON employee_reporting_lines(employee_assignment_id)
    WHERE
        relationship_type = 'PRIMARY'
        AND status = 'ACTIVE'
        AND effective_to IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_reporting_line_identity
    ON employee_reporting_lines (
        employee_assignment_id,
        reports_to_assignment_id,
        relationship_type,
        COALESCE(effective_from, DATE '1900-01-01')
    );

COMMENT ON TABLE employee_assignments IS
    'Employment/organization assignment combining Employee + Business Unit + Position + allowed Job Grade. Job Level is derived from Job Grade.';

COMMENT ON COLUMN employee_assignments.department_id IS
    'Reserved for Department. Department module remains on HOLD.';

COMMENT ON TABLE employee_reporting_lines IS
    'Actual employee reporting relationships between employee assignments. Supports PRIMARY and DOTTED reporting lines.';

COMMENT ON COLUMN employees.primary_business_unit_id IS
    'Legacy compatibility field. Revised architecture stores Business Unit in employee_assignments.';

COMMENT ON COLUMN employees.position_id IS
    'Legacy compatibility field. Revised architecture stores Position in employee_assignments.';

COMMENT ON COLUMN employees.manager_employee_id IS
    'Legacy compatibility field. Revised architecture stores reporting relationships in employee_reporting_lines.';

COMMENT ON COLUMN employees.job_level IS
    'Legacy compatibility field. Revised architecture derives Job Level from employee_assignments.job_grade_id.';

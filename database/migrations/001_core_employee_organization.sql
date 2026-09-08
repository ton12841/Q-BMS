-- Q BMS v2.0.1.0
-- Database Foundation: Core Access + Organization + Employee
-- Scope: Q BMS only. CRM migration remains on HOLD.


-- =========================================================
-- 1) ORGANIZATION MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS business_units (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id BIGSERIAL PRIMARY KEY,
    department_id BIGINT NOT NULL REFERENCES departments(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    job_level VARCHAR(50),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_department_id
    ON positions(department_id);

-- =========================================================
-- 2) EMPLOYEE MODULE
-- =========================================================

CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    company_email VARCHAR(255) NOT NULL UNIQUE,

    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    nickname VARCHAR(120),

    department_id BIGINT REFERENCES departments(id),
    primary_business_unit_id BIGINT REFERENCES business_units(id),
    position_id BIGINT REFERENCES positions(id),
    manager_employee_id BIGINT REFERENCES employees(id),

    employment_type VARCHAR(50),
    employee_status VARCHAR(50) NOT NULL DEFAULT 'PRE_ONBOARDING',
    employee_record_type VARCHAR(50) NOT NULL DEFAULT 'NEW_HIRE',

    work_location VARCHAR(150),
    job_level VARCHAR(50),

    start_date DATE,
    probation_days INTEGER,
    probation_end_date DATE,
    contract_end_date DATE,

    hr_note TEXT,

    is_test_account BOOLEAN NOT NULL DEFAULT FALSE,
    qa_profile_key VARCHAR(100),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_employees_department_id
    ON employees(department_id);

CREATE INDEX IF NOT EXISTS idx_employees_primary_business_unit_id
    ON employees(primary_business_unit_id);

CREATE INDEX IF NOT EXISTS idx_employees_position_id
    ON employees(position_id);

CREATE INDEX IF NOT EXISTS idx_employees_manager_employee_id
    ON employees(manager_employee_id);

CREATE INDEX IF NOT EXISTS idx_employees_employee_status
    ON employees(employee_status);

CREATE TABLE IF NOT EXISTS employee_business_units (
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    business_unit_id BIGINT NOT NULL REFERENCES business_units(id),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (employee_id, business_unit_id)
);

-- =========================================================
-- 3) CORE AUTH / ACCESS FOUNDATION
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT UNIQUE REFERENCES employees(id),
    email VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'GOOGLE',
    google_subject VARCHAR(255) UNIQUE,

    account_status VARCHAR(50) NOT NULL DEFAULT 'PRE_ONBOARDING',

    is_system_admin BOOLEAN NOT NULL DEFAULT FALSE,
    system_admin_role VARCHAR(100),

    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(180) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT,
    permission_group VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================
-- 4) CORE AUDIT FOUNDATION
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id),
    action VARCHAR(150) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id
    ON audit_logs(actor_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);

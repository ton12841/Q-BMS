-- Q BMS v2.0.12.0
-- New Employee Onboarding Foundation
-- Scope: New Hire onboarding is the permanent HR flow.
-- Existing Employee import is reserved for initial/system migration utilities.

-- =========================================================
-- 1) EMPLOYEE PRE-REGISTRATION
-- =========================================================
-- HR must be able to create a New Employee before IT creates the
-- Google Workspace account. Company Email therefore becomes nullable
-- during PRE_ONBOARDING.

ALTER TABLE employees
    ALTER COLUMN company_email DROP NOT NULL;

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS profile_status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_employees_profile_status'
    ) THEN
        ALTER TABLE employees
            ADD CONSTRAINT chk_employees_profile_status
            CHECK (profile_status IN (
                'NOT_STARTED',
                'IN_PROGRESS',
                'SUBMITTED',
                'COMPLETE'
            ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_profile_status
    ON employees(profile_status);

-- =========================================================
-- 2) IT GOOGLE WORKSPACE ACCOUNT SETUP REQUEST
-- =========================================================
-- Flow:
-- HR creates Pre-Employee -> IT receives setup request -> IT creates
-- Google Workspace account -> IT confirms Company Email in Q BMS.

CREATE TABLE IF NOT EXISTS employee_account_setup_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    request_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    requested_by_user_id BIGINT REFERENCES users(id),
    assigned_to_user_id BIGINT REFERENCES users(id),

    company_email VARCHAR(255),
    it_note TEXT,

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_employee_account_setup_request_status
        CHECK (request_status IN (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        )),

    CONSTRAINT chk_employee_account_setup_completed_email
        CHECK (request_status <> 'COMPLETED' OR company_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_employee_account_setup_employee_id
    ON employee_account_setup_requests(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_account_setup_status
    ON employee_account_setup_requests(request_status);

-- One open IT setup request per employee at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_account_setup_open_request
    ON employee_account_setup_requests(employee_id)
    WHERE request_status IN ('PENDING', 'IN_PROGRESS');

-- =========================================================
-- 3) EMPLOYEE INVITATION FOUNDATION
-- =========================================================
-- Invitation is NOT the Google account itself. It is a Q BMS onboarding
-- invitation sent to the confirmed Company Email. Only token hashes are
-- reserved for storage; plaintext invitation tokens must never be stored.

CREATE TABLE IF NOT EXISTS employee_invitations (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,

    invitation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    token_hash VARCHAR(255),

    invited_by_user_id BIGINT REFERENCES users(id),
    sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_employee_invitation_status
        CHECK (invitation_status IN (
            'DRAFT',
            'SENT',
            'ACCEPTED',
            'EXPIRED',
            'REVOKED'
        ))
);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_employee_id
    ON employee_invitations(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_invitations_status
    ON employee_invitations(invitation_status);

-- Prevent duplicate active invitations for the same employee.
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_invitations_open
    ON employee_invitations(employee_id)
    WHERE invitation_status IN ('DRAFT', 'SENT');

-- =========================================================
-- 4) EXISTING DATA COMPATIBILITY
-- =========================================================
-- Current v2 records remain valid. Existing employees with Company Email
-- are not converted into the New Hire workflow automatically.

UPDATE employees
SET profile_status = 'NOT_STARTED'
WHERE profile_status IS NULL;

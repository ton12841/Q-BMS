-- Q BMS v2.0.16.0
-- HR Invitation Management Foundation
--
-- Scope:
-- IT confirms Company Email -> HR sees invitation-ready employee
-- -> HR queues onboarding invitation -> future mail transport delivers it
-- -> employee signs in with Google in the next SSO phase.
--
-- Important: queued invitation is NOT marked SENT until a mail transport
-- confirms delivery. This keeps workflow state truthful during development.

ALTER TABLE employee_invitations
    ADD COLUMN IF NOT EXISTS public_id UUID,
    ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;

UPDATE employee_invitations
SET public_id = gen_random_uuid()
WHERE public_id IS NULL;

ALTER TABLE employee_invitations
    ALTER COLUMN public_id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_invitations_public_id
    ON employee_invitations(public_id);

ALTER TABLE employee_invitations
    DROP CONSTRAINT IF EXISTS chk_employee_invitation_status;

ALTER TABLE employee_invitations
    ADD CONSTRAINT chk_employee_invitation_status
    CHECK (invitation_status IN (
        'DRAFT',
        'QUEUED',
        'SENT',
        'ACCEPTED',
        'EXPIRED',
        'REVOKED'
    ));

DROP INDEX IF EXISTS uq_employee_invitations_open;
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_invitations_open
    ON employee_invitations(employee_id)
    WHERE invitation_status IN ('DRAFT', 'QUEUED', 'SENT');

INSERT INTO permissions (code, name, description, permission_group)
VALUES (
    'employee.invitation.manage',
    'Manage Employee Invitations',
    'Prepare, queue and revoke Q BMS onboarding invitations for employees whose Company Email is ready.',
    'Employee Onboarding'
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    permission_group = EXCLUDED.permission_group;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'employee.invitation.manage'
WHERE r.code = 'HR_EMPLOYEE_ADMIN'
ON CONFLICT DO NOTHING;

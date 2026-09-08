import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../../modules/notification/notification.repository.js';

const INVITATION_SELECT = `
  e.id AS employee_id,
  e.employee_code,
  e.first_name,
  e.last_name,
  e.nickname,
  e.company_email,
  e.employee_status,
  e.profile_status,
  e.start_date,
  setup.id AS account_setup_request_id,
  setup.request_status AS account_setup_status,
  invitation.id AS invitation_id,
  invitation.public_id AS invitation_public_id,
  invitation.invited_email,
  invitation.invitation_status,
  invitation.queued_at,
  invitation.sent_at,
  invitation.expires_at,
  invitation.accepted_at,
  invitation.revoked_at,
  a.business_unit_id,
  a.business_unit_code,
  COALESCE(but.name, a.business_unit_base_name) AS business_unit_name,
  a.position_id,
  a.position_code,
  COALESCE(pt.name, a.position_base_name) AS position_name,
  a.job_grade_id,
  a.grade_number,
  COALESCE(gt.name, a.job_grade_base_name) AS job_grade_name,
  a.job_level_id,
  a.job_level_code,
  COALESCE(lt.name, a.job_level_base_name) AS job_level_name
`;

const COMMON_JOINS = `
  INNER JOIN LATERAL (
    SELECT r.*
    FROM employee_account_setup_requests r
    WHERE r.employee_id = e.id
      AND r.request_status = 'COMPLETED'
    ORDER BY r.completed_at DESC NULLS LAST, r.id DESC
    LIMIT 1
  ) setup ON TRUE
  LEFT JOIN LATERAL (
    SELECT i.*
    FROM employee_invitations i
    WHERE i.employee_id = e.id
    ORDER BY i.created_at DESC, i.id DESC
    LIMIT 1
  ) invitation ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      ea.id AS assignment_id,
      ea.business_unit_id,
      bu.code AS business_unit_code,
      bu.name AS business_unit_base_name,
      ea.position_id,
      p.code AS position_code,
      p.name AS position_base_name,
      ea.job_grade_id,
      g.grade_number,
      g.name AS job_grade_base_name,
      g.job_level_id,
      l.code AS job_level_code,
      l.name AS job_level_base_name
    FROM employee_assignments ea
    INNER JOIN business_units bu ON bu.id = ea.business_unit_id
    INNER JOIN positions p ON p.id = ea.position_id
    INNER JOIN job_grades g ON g.id = ea.job_grade_id
    INNER JOIN job_levels l ON l.id = g.job_level_id
    WHERE ea.employee_id = e.id
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
    ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC
    LIMIT 1
  ) a ON TRUE
  LEFT JOIN business_unit_translations but
    ON but.business_unit_id = a.business_unit_id AND but.locale = $1
  LEFT JOIN position_translations pt
    ON pt.position_id = a.position_id AND pt.locale = $1
  LEFT JOIN job_grade_translations gt
    ON gt.job_grade_id = a.job_grade_id AND gt.locale = $1
  LEFT JOIN job_level_translations lt
    ON lt.job_level_id = a.job_level_id AND lt.locale = $1
`;

export async function listInvitationCandidates({ locale = 'en' } = {}) {
  const result = await db.query(
    `
      SELECT ${INVITATION_SELECT}
      FROM employees e
      ${COMMON_JOINS}
      WHERE e.archived_at IS NULL
        AND e.company_email IS NOT NULL
      ORDER BY
        CASE COALESCE(invitation.invitation_status, 'DRAFT')
          WHEN 'DRAFT' THEN 0
          WHEN 'QUEUED' THEN 1
          WHEN 'SENT' THEN 2
          WHEN 'ACCEPTED' THEN 3
          WHEN 'EXPIRED' THEN 4
          ELSE 5
        END,
        setup.completed_at DESC NULLS LAST,
        e.employee_code
    `,
    [locale]
  );

  return result.rows;
}

export async function getInvitationCandidate({ employeeId, locale = 'en' }) {
  const result = await db.query(
    `
      SELECT ${INVITATION_SELECT}
      FROM employees e
      ${COMMON_JOINS}
      WHERE e.id = $2
        AND e.archived_at IS NULL
        AND e.company_email IS NOT NULL
    `,
    [locale, employeeId]
  );

  return result.rows[0] || null;
}

async function ensureInvitation(client, employee) {
  const existing = await client.query(
    `
      SELECT *
      FROM employee_invitations
      WHERE employee_id = $1
        AND invitation_status IN ('DRAFT', 'QUEUED', 'SENT')
      ORDER BY created_at DESC, id DESC
      LIMIT 1
      FOR UPDATE
    `,
    [employee.id]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].invited_email !== employee.company_email) {
      const updated = await client.query(
        `
          UPDATE employee_invitations
          SET invited_email = $2,
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [existing.rows[0].id, employee.company_email]
      );
      return updated.rows[0];
    }
    return existing.rows[0];
  }

  const inserted = await client.query(
    `
      INSERT INTO employee_invitations (
        employee_id,
        invited_email,
        invitation_status,
        token_hash,
        invited_by_user_id
      )
      VALUES ($1, $2, 'DRAFT', NULL, NULL)
      RETURNING *
    `,
    [employee.id, employee.company_email]
  );

  return inserted.rows[0];
}

export async function queueEmployeeInvitation({ employeeId, expiresInDays = 7 }) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const employeeResult = await client.query(
      `
        SELECT e.id, e.employee_code, e.first_name, e.last_name, e.company_email,
               setup.id AS account_setup_request_id
        FROM employees e
        INNER JOIN LATERAL (
          SELECT r.id
          FROM employee_account_setup_requests r
          WHERE r.employee_id = e.id
            AND r.request_status = 'COMPLETED'
          ORDER BY r.completed_at DESC NULLS LAST, r.id DESC
          LIMIT 1
        ) setup ON TRUE
        WHERE e.id = $1
          AND e.archived_at IS NULL
        FOR UPDATE OF e
      `,
      [employeeId]
    );

    const employee = employeeResult.rows[0];
    if (!employee) {
      const error = new Error('Employee is not ready for invitation. IT account setup must be completed first.');
      error.statusCode = 409;
      throw error;
    }

    if (!employee.company_email) {
      const error = new Error('Company Email is required before an invitation can be queued.');
      error.statusCode = 409;
      throw error;
    }

    let invitation = await ensureInvitation(client, employee);

    if (['QUEUED', 'SENT'].includes(invitation.invitation_status)) {
      const error = new Error('This employee already has an active invitation.');
      error.statusCode = 409;
      throw error;
    }

    const updated = await client.query(
      `
        UPDATE employee_invitations
        SET invitation_status = 'QUEUED',
            invited_email = $2,
            queued_at = NOW(),
            expires_at = NOW() + ($3::text || ' days')::interval,
            revoked_at = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [invitation.id, employee.company_email, expiresInDays]
    );

    invitation = updated.rows[0];
    const activationPath = `/activate/${invitation.public_id}`;

    await createWorkflowNotification(client, {
      eventCode: 'EMPLOYEE_INVITATION_QUEUED',
      sourceModule: 'HRM',
      entityType: 'EMPLOYEE_INVITATION',
      entityId: invitation.id,
      payload: {
        employee_id: employee.id,
        employee_code: employee.employee_code,
        employee_name: [employee.first_name, employee.last_name].filter(Boolean).join(' '),
        company_email: employee.company_email,
        invitation_id: invitation.id,
        invitation_public_id: invitation.public_id,
        activation_path: activationPath,
        expires_at: invitation.expires_at,
      },
      targets: [
        {
          channel: 'EMAIL',
          targetType: 'EMAIL',
          targetValue: employee.company_email,
          recipientEmail: employee.company_email,
        },
      ],
    });

    await client.query('COMMIT');
    return invitation;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeEmployeeInvitation({ employeeId }) {
  const result = await db.query(
    `
      UPDATE employee_invitations
      SET invitation_status = 'REVOKED',
          revoked_at = NOW(),
          updated_at = NOW()
      WHERE id = (
        SELECT id
        FROM employee_invitations
        WHERE employee_id = $1
          AND invitation_status IN ('DRAFT', 'QUEUED', 'SENT')
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      )
      RETURNING *
    `,
    [employeeId]
  );

  return result.rows[0] || null;
}

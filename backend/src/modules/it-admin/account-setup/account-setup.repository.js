import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../notification/notification.repository.js';

const REQUEST_SELECT = `
  r.id,
  r.employee_id,
  r.request_status,
  r.assigned_to_user_id,
  r.company_email,
  r.it_note,
  r.requested_at,
  r.started_at,
  r.completed_at,
  r.cancelled_at,
  r.created_at,
  r.updated_at,
  e.employee_code,
  e.first_name,
  e.last_name,
  e.nickname,
  e.start_date,
  e.employee_status,
  e.profile_status,
  e.company_email AS employee_company_email,
  a.assignment_id,
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
  COALESCE(lt.name, a.job_level_base_name) AS job_level_name,
  invitation.id AS invitation_id,
  invitation.invitation_status,
  invitation.invited_email
`;

const ASSIGNMENT_JOIN = `
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
  LEFT JOIN LATERAL (
    SELECT i.id, i.invitation_status, i.invited_email
    FROM employee_invitations i
    WHERE i.employee_id = e.id
    ORDER BY i.created_at DESC, i.id DESC
    LIMIT 1
  ) invitation ON TRUE
`;

function requestQuery(whereSql) {
  return `
    SELECT ${REQUEST_SELECT}
    FROM employee_account_setup_requests r
    INNER JOIN employees e ON e.id = r.employee_id
    ${ASSIGNMENT_JOIN}
    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = a.business_unit_id AND but.locale = $1
    LEFT JOIN position_translations pt
      ON pt.position_id = a.position_id AND pt.locale = $1
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = a.job_grade_id AND gt.locale = $1
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = a.job_level_id AND lt.locale = $1
    ${whereSql}
  `;
}

export async function listAccountSetupRequests({ locale = 'en' } = {}) {
  const result = await db.query(
    `${requestQuery("WHERE e.archived_at IS NULL")}
     ORDER BY
       CASE r.request_status
         WHEN 'PENDING' THEN 0
         WHEN 'IN_PROGRESS' THEN 1
         WHEN 'COMPLETED' THEN 2
         ELSE 3
       END,
       r.requested_at DESC,
       r.id DESC`,
    [locale]
  );
  return result.rows;
}

export async function getAccountSetupRequest({ id, locale = 'en' }) {
  const result = await db.query(
    requestQuery('WHERE r.id = $2 AND e.archived_at IS NULL'),
    [locale, id]
  );
  return result.rows[0] || null;
}

export async function startAccountSetupRequest({ id }) {
  const result = await db.query(
    `
      UPDATE employee_account_setup_requests
      SET request_status = 'IN_PROGRESS',
          started_at = COALESCE(started_at, NOW()),
          updated_at = NOW()
      WHERE id = $1
        AND request_status IN ('PENDING', 'IN_PROGRESS')
      RETURNING *
    `,
    [id]
  );
  return result.rows[0] || null;
}

async function ensureInvitationDraft(client, employeeId, companyEmail) {
  const existing = await client.query(
    `
      SELECT id, invitation_status
      FROM employee_invitations
      WHERE employee_id = $1
        AND invitation_status IN ('DRAFT', 'SENT')
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [employeeId]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].invitation_status === 'DRAFT') {
      await client.query(
        `
          UPDATE employee_invitations
          SET invited_email = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [existing.rows[0].id, companyEmail]
      );
    }
    return existing.rows[0].id;
  }

  const result = await client.query(
    `
      INSERT INTO employee_invitations (
        employee_id,
        invited_email,
        invitation_status,
        token_hash,
        invited_by_user_id
      )
      VALUES ($1, $2, 'DRAFT', NULL, NULL)
      RETURNING id
    `,
    [employeeId, companyEmail]
  );

  return result.rows[0].id;
}

export async function completeAccountSetupRequest({ id, companyEmail, itNote = null }) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      `
        SELECT r.*, e.employee_code, e.first_name, e.last_name
        FROM employee_account_setup_requests r
        INNER JOIN employees e ON e.id = r.employee_id
        WHERE r.id = $1
        FOR UPDATE
      `,
      [id]
    );

    const request = requestResult.rows[0];
    if (!request) {
      await client.query('ROLLBACK');
      return null;
    }

    if (request.request_status === 'CANCELLED') {
      const error = new Error('Cancelled account setup request cannot be completed.');
      error.statusCode = 400;
      throw error;
    }

    if (request.request_status === 'COMPLETED') {
      if (String(request.company_email || '').toLowerCase() !== companyEmail) {
        const error = new Error('This account setup request has already been completed with another Company Email.');
        error.statusCode = 409;
        throw error;
      }
      await client.query('COMMIT');
      return request;
    }

    await client.query(
      `
        UPDATE employees
        SET company_email = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [request.employee_id, companyEmail]
    );

    const updatedResult = await client.query(
      `
        UPDATE employee_account_setup_requests
        SET request_status = 'COMPLETED',
            company_email = $2,
            it_note = $3,
            started_at = COALESCE(started_at, NOW()),
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id, companyEmail, itNote]
    );

    const invitationId = await ensureInvitationDraft(
      client,
      request.employee_id,
      companyEmail
    );

    await createWorkflowNotification(client, {
      eventCode: 'IT_ACCOUNT_READY',
      sourceModule: 'IT_ADMIN',
      entityType: 'EMPLOYEE_ACCOUNT_SETUP_REQUEST',
      entityId: id,
      payload: {
        employee_id: request.employee_id,
        employee_code: request.employee_code,
        employee_name: [request.first_name, request.last_name].filter(Boolean).join(' '),
        company_email: companyEmail,
        account_setup_request_id: id,
        invitation_id: invitationId,
      },
      targets: [
        {
          channel: 'IN_APP',
          targetType: 'ROLE',
          targetValue: 'HR_EMPLOYEE_ADMIN',
        },
        {
          channel: 'EMAIL',
          targetType: 'ROLE',
          targetValue: 'HR_EMPLOYEE_ADMIN',
        },
      ],
    });

    await client.query('COMMIT');
    return updatedResult.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Keep the original transaction error.
    }
    throw error;
  } finally {
    client.release();
  }
}

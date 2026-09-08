import { db } from '../../config/database/postgres.js';
import { createWorkflowNotification } from '../notification/notification.repository.js';

const CURRENT_ASSIGNMENT_JOIN = `
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
      l.name AS job_level_base_name,
      ea.assignment_status,
      ea.effective_from,
      ea.effective_to
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
`;

const ONBOARDING_JOIN = `
  LEFT JOIN LATERAL (
    SELECT
      r.id AS account_setup_request_id,
      r.request_status AS account_setup_status,
      r.company_email AS account_setup_company_email,
      r.requested_at AS account_setup_requested_at,
      r.completed_at AS account_setup_completed_at
    FROM employee_account_setup_requests r
    WHERE r.employee_id = e.id
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT 1
  ) setup ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      i.id AS invitation_id,
      i.invitation_status,
      i.invited_email,
      i.sent_at AS invitation_sent_at,
      i.expires_at AS invitation_expires_at,
      i.accepted_at AS invitation_accepted_at
    FROM employee_invitations i
    WHERE i.employee_id = e.id
    ORDER BY i.created_at DESC, i.id DESC
    LIMIT 1
  ) invitation ON TRUE
  LEFT JOIN users u ON u.employee_id = e.id
  LEFT JOIN onboarding_cases oc ON oc.employee_id = e.id
`;

const EMPLOYEE_SELECT = `
  e.id, e.employee_code, e.company_email,
  e.first_name, e.last_name, e.nickname,
  e.employment_type, e.employee_status, e.employee_record_type,
  e.profile_status,
  e.work_location, e.start_date, e.probation_days,
  e.probation_end_date, e.contract_end_date,
  e.created_at, e.updated_at,
  a.assignment_id,
  a.business_unit_id, a.business_unit_code,
  COALESCE(but.name, a.business_unit_base_name) AS business_unit_name,
  a.position_id, a.position_code,
  COALESCE(pt.name, a.position_base_name) AS position_name,
  a.job_grade_id, a.grade_number,
  COALESCE(gt.name, a.job_grade_base_name) AS job_grade_name,
  a.job_level_id, a.job_level_code,
  COALESCE(lt.name, a.job_level_base_name) AS job_level_name,
  a.assignment_status, a.effective_from, a.effective_to,
  setup.account_setup_request_id,
  setup.account_setup_status,
  setup.account_setup_company_email,
  setup.account_setup_requested_at,
  setup.account_setup_completed_at,
  invitation.invitation_id,
  invitation.invitation_status,
  invitation.invited_email,
  invitation.invitation_sent_at,
  invitation.invitation_expires_at,
  invitation.invitation_accepted_at,
  u.id AS user_id,
  u.account_status AS qbms_account_status,
  u.google_subject,
  oc.case_status AS onboarding_case_status,
  oc.submitted_at AS onboarding_submitted_at,
  oc.completed_at AS onboarding_completed_at
`;

export async function listEmployees({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      ${EMPLOYEE_SELECT}
    FROM employees e
    ${CURRENT_ASSIGNMENT_JOIN}
    ${ONBOARDING_JOIN}
    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = a.business_unit_id AND but.locale = $1
    LEFT JOIN position_translations pt
      ON pt.position_id = a.position_id AND pt.locale = $1
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = a.job_grade_id AND gt.locale = $1
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = a.job_level_id AND lt.locale = $1
    WHERE e.archived_at IS NULL
    ORDER BY
      CASE WHEN e.employee_status = 'ACTIVE' THEN 0 ELSE 1 END,
      e.employee_code, e.first_name, e.last_name
  `, [locale]);

  return result.rows;
}

export async function getEmployeeById({ id, locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      ${EMPLOYEE_SELECT},
      e.hr_note
    FROM employees e
    ${CURRENT_ASSIGNMENT_JOIN}
    ${ONBOARDING_JOIN}
    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = a.business_unit_id AND but.locale = $2
    LEFT JOIN position_translations pt
      ON pt.position_id = a.position_id AND pt.locale = $2
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = a.job_grade_id AND gt.locale = $2
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = a.job_level_id AND lt.locale = $2
    WHERE e.id = $1 AND e.archived_at IS NULL
  `, [id, locale]);

  return result.rows[0] || null;
}

export async function validateEmployeeAssignment({ businessUnitId, positionId, jobGradeId }) {
  const result = await db.query(`
    SELECT
      EXISTS (
        SELECT 1 FROM business_units
        WHERE id = $1 AND status = 'ACTIVE'
      ) AS business_unit_exists,
      EXISTS (
        SELECT 1 FROM positions
        WHERE id = $2 AND status = 'ACTIVE'
      ) AS position_exists,
      EXISTS (
        SELECT 1 FROM job_grades
        WHERE id = $3 AND status = 'ACTIVE'
      ) AS job_grade_exists,
      EXISTS (
        SELECT 1 FROM position_job_grades
        WHERE position_id = $2 AND job_grade_id = $3
      ) AS position_grade_allowed
  `, [businessUnitId, positionId, jobGradeId]);

  return result.rows[0];
}

async function upsertPrimaryAssignment(client, employeeId, assignment) {
  const existing = await client.query(`
    SELECT id
    FROM employee_assignments
    WHERE employee_id = $1
      AND is_primary = TRUE
      AND assignment_status = 'ACTIVE'
      AND effective_to IS NULL
    ORDER BY id DESC
    LIMIT 1
  `, [employeeId]);

  if (existing.rows[0]) {
    const result = await client.query(`
      UPDATE employee_assignments
      SET business_unit_id = $2,
          position_id = $3,
          job_grade_id = $4,
          department_id = NULL,
          assignment_status = 'ACTIVE',
          effective_from = $5,
          effective_to = NULL,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      existing.rows[0].id,
      assignment.businessUnitId,
      assignment.positionId,
      assignment.jobGradeId,
      assignment.effectiveFrom,
    ]);
    return result.rows[0];
  }

  const result = await client.query(`
    INSERT INTO employee_assignments (
      employee_id, business_unit_id, position_id, job_grade_id,
      department_id, is_primary, assignment_status,
      effective_from, effective_to,
      change_type
    )
    VALUES ($1, $2, $3, $4, NULL, TRUE, 'ACTIVE', $5, NULL, 'INITIAL')
    RETURNING *
  `, [
    employeeId,
    assignment.businessUnitId,
    assignment.positionId,
    assignment.jobGradeId,
    assignment.effectiveFrom,
  ]);

  return result.rows[0];
}

export async function insertNewEmployee({ employee, assignment }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const employeeResult = await client.query(`
      INSERT INTO employees (
        employee_code, company_email, first_name, last_name, nickname,
        department_id, primary_business_unit_id, position_id, manager_employee_id,
        employment_type, employee_status, employee_record_type, profile_status,
        work_location, job_level, start_date, probation_days,
        probation_end_date, contract_end_date, hr_note,
        is_test_account, qa_profile_key
      )
      VALUES (
        $1, NULL, $2, $3, $4,
        NULL, NULL, NULL, NULL,
        $5, 'PRE_ONBOARDING', 'NEW_HIRE', 'NOT_STARTED',
        $6, NULL, $7, $8,
        $9, $10, $11,
        FALSE, NULL
      )
      RETURNING *
    `, [
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.nickname,
      employee.employmentType,
      employee.workLocation,
      employee.startDate,
      employee.probationDays,
      employee.probationEndDate,
      employee.contractEndDate,
      employee.hrNote,
    ]);

    const employeeId = employeeResult.rows[0].id;
    await upsertPrimaryAssignment(client, employeeId, assignment);

    const setupResult = await client.query(`
      INSERT INTO employee_account_setup_requests (
        employee_id,
        request_status,
        requested_by_user_id,
        assigned_to_user_id,
        company_email,
        it_note
      )
      VALUES ($1, 'PENDING', NULL, NULL, NULL, NULL)
      RETURNING id, request_status, requested_at
    `, [employeeId]);

    const setupRequest = setupResult.rows[0];

    await createWorkflowNotification(client, {
      eventCode: 'IT_ACCOUNT_SETUP_REQUESTED',
      sourceModule: 'EMPLOYEE',
      entityType: 'EMPLOYEE_ACCOUNT_SETUP_REQUEST',
      entityId: setupRequest.id,
      payload: {
        employee_id: employeeId,
        employee_code: employee.employeeCode,
        employee_name: [employee.firstName, employee.lastName].filter(Boolean).join(' '),
        start_date: employee.startDate,
        account_setup_request_id: setupRequest.id,
      },
      targets: [
        {
          channel: 'IN_APP',
          targetType: 'ROLE',
          targetValue: 'IT_ACCOUNT_ADMIN',
        },
        {
          channel: 'EMAIL',
          targetType: 'ROLE',
          targetValue: 'IT_ACCOUNT_ADMIN',
        },
      ],
    });

    await client.query('COMMIT');
    return employeeResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateEmployeeRecord({ id, employee, assignment, updateAssignment = true }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const employeeResult = await client.query(`
      UPDATE employees
      SET employee_code = $2,
          first_name = $3,
          last_name = $4,
          nickname = $5,
          employment_type = $6,
          work_location = $7,
          start_date = $8,
          probation_days = $9,
          probation_end_date = $10,
          contract_end_date = $11,
          hr_note = $12,
          updated_at = NOW()
      WHERE id = $1 AND archived_at IS NULL
      RETURNING *
    `, [
      id,
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.nickname,
      employee.employmentType,
      employee.workLocation,
      employee.startDate,
      employee.probationDays,
      employee.probationEndDate,
      employee.contractEndDate,
      employee.hrNote,
    ]);

    if (!employeeResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    if (updateAssignment) {
      await upsertPrimaryAssignment(client, id, assignment);
    }
    await client.query('COMMIT');
    return employeeResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

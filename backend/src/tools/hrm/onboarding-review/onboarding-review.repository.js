import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../../modules/notification/notification.repository.js';

const REVIEW_STATUSES = ['SUBMITTED', 'CHANGES_REQUESTED', 'HR_APPROVED'];

function reviewError(message, statusCode = 409, code = 'HR_REVIEW_INVALID_STATE') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export async function listOnboardingReviewCases({ locale = 'en' } = {}) {
  const result = await db.query(
    `SELECT
       oc.id AS onboarding_case_id,
       oc.case_status,
       oc.submitted_at,
       oc.updated_at,
       e.id AS employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.nickname,
       e.company_email,
       e.employee_status,
       e.profile_status,
       e.start_date,
       a.business_unit_id,
       COALESCE(but.name, bu.name) AS business_unit_name,
       a.position_id,
       COALESCE(pt.name, p.name) AS position_name,
       a.job_grade_id,
       g.grade_number,
       COALESCE(gt.name, g.name) AS job_grade_name,
       COALESCE(lt.name, jl.name) AS job_level_name,
       hr.task_status AS hr_review_task_status,
       asset.task_status AS asset_task_status,
       latest.review_action AS latest_review_action,
       latest.review_note AS latest_review_note,
       latest.created_at AS latest_review_at
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     LEFT JOIN LATERAL (
       SELECT ea.*
       FROM employee_assignments ea
       WHERE ea.employee_id = e.id
         AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE'
         AND ea.effective_to IS NULL
       ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC
       LIMIT 1
     ) a ON TRUE
     LEFT JOIN business_units bu ON bu.id = a.business_unit_id
     LEFT JOIN business_unit_translations but ON but.business_unit_id = bu.id AND but.locale = $1
     LEFT JOIN positions p ON p.id = a.position_id
     LEFT JOIN position_translations pt ON pt.position_id = p.id AND pt.locale = $1
     LEFT JOIN job_grades g ON g.id = a.job_grade_id
     LEFT JOIN job_grade_translations gt ON gt.job_grade_id = g.id AND gt.locale = $1
     LEFT JOIN job_levels jl ON jl.id = g.job_level_id
     LEFT JOIN job_level_translations lt ON lt.job_level_id = jl.id AND lt.locale = $1
     LEFT JOIN onboarding_tasks hr ON hr.employee_id = e.id AND hr.task_code = 'HR_REVIEW'
     LEFT JOIN onboarding_tasks asset ON asset.employee_id = e.id AND asset.task_code = 'ASSET_ASSIGNMENT'
     LEFT JOIN LATERAL (
       SELECT r.review_action, r.review_note, r.created_at
       FROM onboarding_reviews r
       WHERE r.employee_id = e.id
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 1
     ) latest ON TRUE
     WHERE e.archived_at IS NULL
       AND oc.case_status = ANY($2::text[])
     ORDER BY
       CASE oc.case_status
         WHEN 'SUBMITTED' THEN 0
         WHEN 'CHANGES_REQUESTED' THEN 1
         WHEN 'HR_APPROVED' THEN 2
         ELSE 3
       END,
       oc.submitted_at DESC NULLS LAST,
       oc.updated_at DESC,
       e.employee_code`,
    [locale, REVIEW_STATUSES]
  );
  return result.rows;
}

export async function getOnboardingReviewCase(employeeId) {
  const result = await db.query(
    `SELECT
       oc.*,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.nickname,
       e.company_email,
       e.employee_status,
       e.profile_status
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     WHERE oc.employee_id = $1
       AND e.archived_at IS NULL
     LIMIT 1`,
    [employeeId]
  );
  return result.rows[0] || null;
}

export async function listOnboardingReviewHistory(employeeId) {
  const result = await db.query(
    `SELECT id, onboarding_case_id, employee_id, reviewer_user_id,
            review_action, review_note, created_at
     FROM onboarding_reviews
     WHERE employee_id = $1
     ORDER BY created_at DESC, id DESC`,
    [employeeId]
  );
  return result.rows;
}

async function lockReviewCase(client, employeeId) {
  const result = await client.query(
    `SELECT
       oc.id AS onboarding_case_id,
       oc.case_status,
       oc.submitted_at,
       e.id AS employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.company_email,
       e.profile_status
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     WHERE e.id = $1
       AND e.archived_at IS NULL
     FOR UPDATE OF oc, e`,
    [employeeId]
  );
  const row = result.rows[0];
  if (!row) throw reviewError('Onboarding case was not found.', 404, 'ONBOARDING_CASE_NOT_FOUND');
  return row;
}

async function recordReview(client, { onboardingCaseId, employeeId, reviewerUserId, action, note }) {
  await client.query(
    `INSERT INTO onboarding_reviews (
       onboarding_case_id, employee_id, reviewer_user_id, review_action, review_note
     ) VALUES ($1, $2, $3, $4, $5)`,
    [onboardingCaseId, employeeId, reviewerUserId, action, note]
  );
}

function employeeEmailTarget(companyEmail) {
  if (!companyEmail) return [];
  return [{
    channel: 'EMAIL',
    targetType: 'EMAIL',
    targetValue: companyEmail,
    recipientEmail: companyEmail,
  }];
}

export async function requestOnboardingChanges({ employeeId, reviewerUserId = null, note }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = await lockReviewCase(client, employeeId);
    if (row.case_status !== 'SUBMITTED') {
      throw reviewError('Changes can only be requested while the onboarding case is awaiting HR Review.');
    }

    await recordReview(client, {
      onboardingCaseId: row.onboarding_case_id,
      employeeId,
      reviewerUserId,
      action: 'CHANGES_REQUESTED',
      note,
    });

    await client.query(
      `UPDATE onboarding_cases
       SET case_status = 'CHANGES_REQUESTED',
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [row.onboarding_case_id, JSON.stringify({ hr_review_action: 'CHANGES_REQUESTED', hr_review_note: note })]
    );

    await client.query(
      `UPDATE onboarding_tasks
       SET task_status = 'PENDING',
           completed_at = NULL,
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = NOW()
       WHERE employee_id = $1 AND task_code = $2`,
      [employeeId, 'HR_REVIEW', JSON.stringify({ last_action: 'CHANGES_REQUESTED', review_note: note })]
    );

    await client.query(
      `UPDATE employees
       SET profile_status = 'IN_PROGRESS', updated_at = NOW()
       WHERE id = $1`,
      [employeeId]
    );

    await createWorkflowNotification(client, {
      eventCode: 'EMPLOYEE_ONBOARDING_CHANGES_REQUESTED',
      sourceModule: 'HRM',
      entityType: 'ONBOARDING_CASE',
      entityId: row.onboarding_case_id,
      payload: {
        employee_id: employeeId,
        employee_code: row.employee_code,
        employee_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        company_email: row.company_email,
        review_note: note,
      },
      targets: employeeEmailTarget(row.company_email),
    });

    await client.query('COMMIT');
    return { employee_id: employeeId, onboarding_case_id: row.onboarding_case_id, case_status: 'CHANGES_REQUESTED' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function approveOnboardingReview({ employeeId, reviewerUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = await lockReviewCase(client, employeeId);
    if (row.case_status !== 'SUBMITTED') {
      throw reviewError('Onboarding can only be approved while the case is awaiting HR Review.');
    }

    await recordReview(client, {
      onboardingCaseId: row.onboarding_case_id,
      employeeId,
      reviewerUserId,
      action: 'APPROVED',
      note,
    });

    await client.query(
      `UPDATE onboarding_cases
       SET case_status = 'HR_APPROVED',
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [row.onboarding_case_id, JSON.stringify({ hr_review_action: 'APPROVED', hr_review_note: note })]
    );

    await client.query(
      `UPDATE onboarding_tasks
       SET task_status = 'COMPLETED',
           completed_at = COALESCE(completed_at, NOW()),
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = NOW()
       WHERE employee_id = $1 AND task_code = $2`,
      [employeeId, 'HR_REVIEW', JSON.stringify({ last_action: 'APPROVED', review_note: note })]
    );

    await createWorkflowNotification(client, {
      eventCode: 'EMPLOYEE_ONBOARDING_HR_APPROVED',
      sourceModule: 'HRM',
      entityType: 'ONBOARDING_CASE',
      entityId: row.onboarding_case_id,
      payload: {
        employee_id: employeeId,
        employee_code: row.employee_code,
        employee_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        company_email: row.company_email,
        review_note: note,
        next_step: 'ASSET_GATE',
      },
      targets: employeeEmailTarget(row.company_email),
    });

    await client.query('COMMIT');
    return { employee_id: employeeId, onboarding_case_id: row.onboarding_case_id, case_status: 'HR_APPROVED', next_step: 'ASSET_GATE' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

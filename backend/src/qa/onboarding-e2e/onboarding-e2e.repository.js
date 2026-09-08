import { db } from '../../config/database/postgres.js';

export async function listOnboardingQaEmployees() {
  const result = await db.query(`
    SELECT
      e.id AS employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      e.company_email,
      e.employee_status,
      e.profile_status,
      e.is_test_account,
      e.qa_profile_key,
      COALESCE(oc.case_status, 'NOT_STARTED') AS onboarding_case_status,
      COALESCE(s.request_status, 'NOT_STARTED') AS account_setup_status,
      COALESCE(i.invitation_status, 'NOT_STARTED') AS invitation_status,
      CASE WHEN u.google_subject IS NOT NULL AND BTRIM(u.google_subject) <> '' THEN TRUE ELSE FALSE END AS identity_linked,
      COALESCE(u.account_status, 'NOT_LINKED') AS user_account_status,
      e.created_at,
      e.updated_at
    FROM employees e
    LEFT JOIN onboarding_cases oc ON oc.employee_id = e.id
    LEFT JOIN LATERAL (
      SELECT request_status
      FROM employee_account_setup_requests r
      WHERE r.employee_id = e.id
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 1
    ) s ON TRUE
    LEFT JOIN LATERAL (
      SELECT invitation_status
      FROM employee_invitations inv
      WHERE inv.employee_id = e.id
      ORDER BY inv.created_at DESC, inv.id DESC
      LIMIT 1
    ) i ON TRUE
    LEFT JOIN users u ON u.employee_id = e.id
    WHERE e.archived_at IS NULL
    ORDER BY e.is_test_account DESC, e.updated_at DESC, e.employee_code
  `);
  return result.rows;
}

export async function getOnboardingQaSnapshot(employeeId) {
  const employeeResult = await db.query(`
    SELECT
      e.*,
      u.id AS user_id,
      u.email AS user_email,
      u.account_status AS user_account_status,
      u.google_subject,
      u.first_login_at,
      u.last_login_at,
      a.id AS assignment_id,
      a.business_unit_id,
      bu.code AS business_unit_code,
      bu.name AS business_unit_name,
      a.position_id,
      p.code AS position_code,
      p.name AS position_name,
      a.job_grade_id,
      g.grade_number,
      g.name AS job_grade_name,
      jl.id AS job_level_id,
      jl.code AS job_level_code,
      jl.name AS job_level_name
    FROM employees e
    LEFT JOIN users u ON u.employee_id = e.id
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
    LEFT JOIN positions p ON p.id = a.position_id
    LEFT JOIN job_grades g ON g.id = a.job_grade_id
    LEFT JOIN job_levels jl ON jl.id = g.job_level_id
    WHERE e.id = $1 AND e.archived_at IS NULL
    LIMIT 1
  `, [employeeId]);

  const employee = employeeResult.rows[0] || null;
  if (!employee) return null;

  const [setupResult, invitationResult, caseResult, taskResult, reviewResult, gateResult, assetResult, activationResult] = await Promise.all([
    db.query(`SELECT * FROM employee_account_setup_requests WHERE employee_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, [employeeId]),
    db.query(`SELECT id, public_id, invited_email, invitation_status, queued_at, sent_at, expires_at, accepted_at, revoked_at, created_at, updated_at FROM employee_invitations WHERE employee_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, [employeeId]),
    db.query(`SELECT * FROM onboarding_cases WHERE employee_id = $1 LIMIT 1`, [employeeId]),
    db.query(`SELECT id, task_code, task_name, owner_type, task_status, completed_at, metadata FROM onboarding_tasks WHERE employee_id = $1 ORDER BY id`, [employeeId]),
    db.query(`SELECT id, review_action, review_note, reviewer_user_id, created_at FROM onboarding_reviews WHERE employee_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, [employeeId]),
    db.query(`SELECT id, event_type, note, created_at FROM onboarding_asset_gate_events WHERE employee_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, [employeeId]),
    db.query(`SELECT COUNT(*)::int AS asset_count FROM asset_assignments WHERE employee_id = $1 AND assignment_status = 'ACTIVE' AND returned_at IS NULL`, [employeeId]),
    db.query(`SELECT id, event_type, note, created_at FROM onboarding_activation_events WHERE employee_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1`, [employeeId]),
  ]);

  return {
    employee,
    accountSetup: setupResult.rows[0] || null,
    invitation: invitationResult.rows[0] || null,
    onboardingCase: caseResult.rows[0] || null,
    tasks: taskResult.rows,
    latestReview: reviewResult.rows[0] || null,
    latestAssetGateEvent: gateResult.rows[0] || null,
    activeAssetCount: Number(assetResult.rows[0]?.asset_count || 0),
    latestActivationEvent: activationResult.rows[0] || null,
  };
}

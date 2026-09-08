import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../../modules/notification/notification.repository.js';

const ACTIVATION_CASE_STATUSES = ['ASSET_COMPLETED', 'COMPLETED'];

function activationError(message, statusCode = 409, code = 'EMPLOYEE_ACTIVATION_INVALID_STATE', details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) error.details = details;
  return error;
}

export async function listActivationCases({ locale = 'en' } = {}) {
  const result = await db.query(
    `SELECT
       oc.id AS onboarding_case_id,
       oc.case_status,
       oc.completed_at AS onboarding_completed_at,
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
       u.id AS user_id,
       u.account_status AS user_account_status,
       (u.google_subject IS NOT NULL AND BTRIM(u.google_subject) <> '') AS identity_linked,
       COALESCE(but.name, bu.name) AS business_unit_name,
       COALESCE(pt.name, p.name) AS position_name,
       g.grade_number,
       COALESCE(lt.name, jl.name) AS job_level_name,
       activation.task_status AS activation_task_status,
       latest.event_type AS latest_activation_event,
       latest.note AS latest_activation_note,
       latest.created_at AS latest_activation_at
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     LEFT JOIN users u ON u.employee_id = e.id
     LEFT JOIN LATERAL (
       SELECT ea.* FROM employee_assignments ea
       WHERE ea.employee_id = e.id
         AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE'
         AND ea.effective_to IS NULL
       ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC LIMIT 1
     ) a ON TRUE
     LEFT JOIN business_units bu ON bu.id = a.business_unit_id
     LEFT JOIN business_unit_translations but ON but.business_unit_id = bu.id AND but.locale = $1
     LEFT JOIN positions p ON p.id = a.position_id
     LEFT JOIN position_translations pt ON pt.position_id = p.id AND pt.locale = $1
     LEFT JOIN job_grades g ON g.id = a.job_grade_id
     LEFT JOIN job_levels jl ON jl.id = g.job_level_id
     LEFT JOIN job_level_translations lt ON lt.job_level_id = jl.id AND lt.locale = $1
     LEFT JOIN onboarding_tasks activation ON activation.employee_id = e.id AND activation.task_code = 'ACTIVATION'
     LEFT JOIN LATERAL (
       SELECT event_type, note, created_at
       FROM onboarding_activation_events ae
       WHERE ae.employee_id = e.id
       ORDER BY ae.created_at DESC, ae.id DESC LIMIT 1
     ) latest ON TRUE
     WHERE e.archived_at IS NULL
       AND oc.case_status = ANY($2::text[])
     ORDER BY CASE oc.case_status WHEN 'ASSET_COMPLETED' THEN 0 ELSE 1 END,
              oc.updated_at DESC, e.employee_code`,
    [locale, ACTIVATION_CASE_STATUSES]
  );
  return result.rows;
}

export async function getActivationCase(employeeId, locale = 'en') {
  const result = await db.query(
    `SELECT
       oc.id AS onboarding_case_id,
       oc.case_status,
       oc.started_at,
       oc.submitted_at,
       oc.completed_at,
       oc.metadata AS onboarding_metadata,
       e.id AS employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.nickname,
       e.company_email,
       e.employee_status,
       e.profile_status,
       e.employment_type,
       e.start_date,
       e.work_location,
       u.id AS user_id,
       u.email AS user_email,
       u.account_status AS user_account_status,
       u.google_subject,
       u.first_login_at,
       u.last_login_at,
       a.id AS assignment_id,
       a.business_unit_id,
       COALESCE(but.name, bu.name) AS business_unit_name,
       a.position_id,
       COALESCE(pt.name, p.name) AS position_name,
       a.job_grade_id,
       g.grade_number,
       COALESCE(lt.name, jl.name) AS job_level_name,
       invitation.invitation_status,
       invitation.accepted_at AS invitation_accepted_at,
       COALESCE(active_assets.asset_count, 0)::int AS assigned_asset_count,
       gate.event_type AS asset_gate_decision,
       gate.created_at AS asset_gate_completed_at
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     LEFT JOIN users u ON u.employee_id = e.id
     LEFT JOIN LATERAL (
       SELECT ea.* FROM employee_assignments ea
       WHERE ea.employee_id = e.id
         AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE'
         AND ea.effective_to IS NULL
       ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC LIMIT 1
     ) a ON TRUE
     LEFT JOIN business_units bu ON bu.id = a.business_unit_id
     LEFT JOIN business_unit_translations but ON but.business_unit_id = bu.id AND but.locale = $2
     LEFT JOIN positions p ON p.id = a.position_id
     LEFT JOIN position_translations pt ON pt.position_id = p.id AND pt.locale = $2
     LEFT JOIN job_grades g ON g.id = a.job_grade_id
     LEFT JOIN job_levels jl ON jl.id = g.job_level_id
     LEFT JOIN job_level_translations lt ON lt.job_level_id = jl.id AND lt.locale = $2
     LEFT JOIN LATERAL (
       SELECT i.invitation_status, i.accepted_at
       FROM employee_invitations i
       WHERE i.employee_id = e.id
       ORDER BY i.created_at DESC, i.id DESC LIMIT 1
     ) invitation ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS asset_count
       FROM asset_assignments aa
       WHERE aa.employee_id = e.id AND aa.assignment_status = 'ACTIVE' AND aa.returned_at IS NULL
     ) active_assets ON TRUE
     LEFT JOIN LATERAL (
       SELECT ev.event_type, ev.created_at
       FROM onboarding_asset_gate_events ev
       WHERE ev.employee_id = e.id
         AND ev.event_type IN ('ASSETS_ASSIGNED', 'NO_ASSET_REQUIRED')
       ORDER BY ev.created_at DESC, ev.id DESC LIMIT 1
     ) gate ON TRUE
     WHERE e.id = $1 AND e.archived_at IS NULL
     LIMIT 1`,
    [employeeId, locale]
  );
  return result.rows[0] || null;
}

export async function listActivationTasks(employeeId) {
  const result = await db.query(
    `SELECT id, task_code, task_name, owner_type, task_status, completed_at, metadata
     FROM onboarding_tasks
     WHERE employee_id = $1
     ORDER BY id`,
    [employeeId]
  );
  return result.rows;
}

export async function listActivationHistory(employeeId) {
  const result = await db.query(
    `SELECT id, onboarding_case_id, employee_id, actor_user_id, event_type,
            note, metadata, created_at
     FROM onboarding_activation_events
     WHERE employee_id = $1
     ORDER BY created_at DESC, id DESC`,
    [employeeId]
  );
  return result.rows;
}

function emailTarget(companyEmail) {
  if (!companyEmail) return [];
  return [{ channel: 'EMAIL', targetType: 'EMAIL', targetValue: companyEmail, recipientEmail: companyEmail }];
}

async function lockActivationCase(client, employeeId) {
  const result = await client.query(
    `SELECT
       oc.id AS onboarding_case_id,
       oc.case_status,
       oc.completed_at AS onboarding_completed_at,
       e.id AS employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.company_email,
       e.employee_status,
       e.profile_status
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     WHERE e.id = $1 AND e.archived_at IS NULL
     FOR UPDATE OF oc, e`,
    [employeeId]
  );
  const row = result.rows[0];
  if (!row) throw activationError('Employee onboarding case was not found.', 404, 'ONBOARDING_CASE_NOT_FOUND');

  const userResult = await client.query(
    `SELECT id AS user_id, email AS user_email, account_status AS user_account_status, google_subject
     FROM users
     WHERE employee_id = $1
     LIMIT 1
     FOR UPDATE`,
    [employeeId]
  );
  return { ...row, ...(userResult.rows[0] || { user_id: null, user_email: null, user_account_status: null, google_subject: null }) };
}

async function activationBlockers(client, row) {
  const blockers = [];
  if (row.case_status !== 'ASSET_COMPLETED') blockers.push({ code: 'ASSET_GATE_NOT_COMPLETED', message: 'Asset Gate must be completed before activation.' });
  if (!row.company_email) blockers.push({ code: 'COMPANY_EMAIL_MISSING', message: 'Company Email is required.' });
  if (!row.user_id) blockers.push({ code: 'Q_BMS_USER_MISSING', message: 'Q BMS user account has not been linked.' });
  if (!row.google_subject) blockers.push({ code: 'GOOGLE_IDENTITY_NOT_LINKED', message: 'Google Login / Identity Linking must be completed first.' });
  if (row.user_account_status && ['SUSPENDED', 'INACTIVE'].includes(String(row.user_account_status).toUpperCase())) blockers.push({ code: 'USER_ACCOUNT_NOT_ACTIVATABLE', message: `Q BMS user account is ${row.user_account_status}.` });
  if (!['SUBMITTED', 'COMPLETE'].includes(String(row.profile_status || '').toUpperCase())) blockers.push({ code: 'PROFILE_NOT_REVIEWED', message: 'Employee Self-Onboarding profile is not ready for activation.' });

  const invitation = await client.query(
    `SELECT invitation_status, accepted_at
     FROM employee_invitations
     WHERE employee_id = $1
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [row.employee_id]
  );
  if (invitation.rows[0]?.invitation_status !== 'ACCEPTED') blockers.push({ code: 'INVITATION_NOT_ACCEPTED', message: 'Employee invitation must be accepted through Google Login first.' });

  const assignment = await client.query(
    `SELECT id FROM employee_assignments
     WHERE employee_id = $1 AND is_primary = TRUE AND assignment_status = 'ACTIVE' AND effective_to IS NULL
     ORDER BY effective_from DESC NULLS LAST, id DESC LIMIT 1`,
    [row.employee_id]
  );
  if (!assignment.rows[0]) blockers.push({ code: 'PRIMARY_ASSIGNMENT_MISSING', message: 'Primary employment assignment is required.' });

  const incomplete = await client.query(
    `SELECT task_code, task_name, task_status
     FROM onboarding_tasks
     WHERE employee_id = $1
       AND task_code <> 'ACTIVATION'
       AND task_status <> 'COMPLETED'
     ORDER BY id`,
    [row.employee_id]
  );
  for (const task of incomplete.rows) blockers.push({ code: `TASK_${task.task_code}`, message: `${task.task_name} is not completed.` });

  const activationTask = await client.query(
    `SELECT task_status FROM onboarding_tasks WHERE employee_id = $1 AND task_code = 'ACTIVATION' LIMIT 1`,
    [row.employee_id]
  );
  if (!activationTask.rows[0]) blockers.push({ code: 'ACTIVATION_TASK_MISSING', message: 'Activation workflow task is missing.' });

  return blockers;
}

export async function activateEmployee({ employeeId, actorUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = await lockActivationCase(client, employeeId);

    if (
      row.case_status === 'COMPLETED' &&
      row.employee_status === 'ACTIVE' &&
      row.profile_status === 'COMPLETE' &&
      row.user_account_status === 'ACTIVE'
    ) {
      await client.query('COMMIT');
      return { employee_id: employeeId, already_active: true, case_status: 'COMPLETED', next_step: 'EMPLOYEE_WORKSPACE' };
    }

    const blockers = await activationBlockers(client, row);
    if (blockers.length) {
      throw activationError('Employee is not ready for activation.', 409, 'EMPLOYEE_ACTIVATION_BLOCKED', blockers);
    }

    const previous = {
      employee_status: row.employee_status,
      profile_status: row.profile_status,
      user_account_status: row.user_account_status,
      onboarding_case_status: row.case_status,
    };

    await client.query(
      `UPDATE employees
       SET employee_status = 'ACTIVE', profile_status = 'COMPLETE', updated_at = NOW()
       WHERE id = $1`,
      [employeeId]
    );

    await client.query(
      `UPDATE users
       SET account_status = 'ACTIVE',
           email = COALESCE($2, email),
           activated_at = COALESCE(activated_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [row.user_id, row.company_email]
    );

    // EMPLOYEE is the canonical first/base role for employee users. If the
    // role is already seeded, make the assignment idempotently here.
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, r.id
       FROM roles r
       WHERE r.code = 'EMPLOYEE' AND r.status = 'ACTIVE'
       ON CONFLICT DO NOTHING`,
      [row.user_id]
    );

    await client.query(
      `UPDATE onboarding_tasks
       SET task_status = 'COMPLETED',
           completed_at = COALESCE(completed_at, NOW()),
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = NOW()
       WHERE employee_id = $1 AND task_code = $2`,
      [employeeId, 'ACTIVATION', JSON.stringify({ activated_by_user_id: actorUserId, activation_note: note })]
    );

    await client.query(
      `UPDATE onboarding_cases
       SET case_status = 'COMPLETED',
           completed_at = COALESCE(completed_at, NOW()),
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [row.onboarding_case_id, JSON.stringify({ activation_note: note, activated_by_user_id: actorUserId, next_step: 'EMPLOYEE_WORKSPACE' })]
    );

    await client.query(
      `INSERT INTO onboarding_activation_events (
         onboarding_case_id, employee_id, actor_user_id, event_type, note, metadata
       ) VALUES ($1,$2,$3,'ACTIVATED',$4,$5::jsonb)`,
      [row.onboarding_case_id, employeeId, actorUserId, note, JSON.stringify({ previous, next_step: 'EMPLOYEE_WORKSPACE' })]
    );

    await createWorkflowNotification(client, {
      eventCode: 'EMPLOYEE_ONBOARDING_ACTIVATED',
      sourceModule: 'HRM',
      entityType: 'ONBOARDING_CASE',
      entityId: row.onboarding_case_id,
      payload: {
        employee_id: employeeId,
        employee_code: row.employee_code,
        employee_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        company_email: row.company_email,
        employee_status: 'ACTIVE',
        profile_status: 'COMPLETE',
        account_status: 'ACTIVE',
        next_step: 'EMPLOYEE_WORKSPACE',
      },
      targets: [
        ...emailTarget(row.company_email),
        { channel: 'IN_APP', targetType: 'ROLE', targetValue: 'HR_EMPLOYEE_ADMIN' },
      ],
    });

    await client.query('COMMIT');
    return { employee_id: employeeId, activated: true, case_status: 'COMPLETED', next_step: 'EMPLOYEE_WORKSPACE' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

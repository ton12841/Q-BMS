import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../../modules/notification/notification.repository.js';

function gateError(message, statusCode = 409, code = 'ASSET_GATE_INVALID_STATE') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

const GATE_STATUSES = ['HR_APPROVED', 'ASSET_COMPLETED'];

export async function listAssetGateCases({ locale = 'en' } = {}) {
  const result = await db.query(
    `SELECT
       oc.id AS onboarding_case_id, oc.case_status, oc.updated_at,
       e.id AS employee_id, e.employee_code, e.first_name, e.last_name, e.nickname,
       e.company_email, e.employee_status, e.profile_status, e.start_date,
       COALESCE(but.name, bu.name) AS business_unit_name,
       COALESCE(pt.name, p.name) AS position_name,
       g.grade_number, COALESCE(lt.name, jl.name) AS job_level_name,
       asset.task_status AS asset_task_status,
       COALESCE(active_assets.asset_count, 0)::int AS assigned_asset_count,
       latest.event_type AS latest_gate_event,
       latest.note AS latest_gate_note,
       latest.created_at AS latest_gate_at
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     LEFT JOIN LATERAL (
       SELECT ea.* FROM employee_assignments ea
       WHERE ea.employee_id = e.id AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE' AND ea.effective_to IS NULL
       ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC LIMIT 1
     ) a ON TRUE
     LEFT JOIN business_units bu ON bu.id = a.business_unit_id
     LEFT JOIN business_unit_translations but ON but.business_unit_id = bu.id AND but.locale = $1
     LEFT JOIN positions p ON p.id = a.position_id
     LEFT JOIN position_translations pt ON pt.position_id = p.id AND pt.locale = $1
     LEFT JOIN job_grades g ON g.id = a.job_grade_id
     LEFT JOIN job_levels jl ON jl.id = g.job_level_id
     LEFT JOIN job_level_translations lt ON lt.job_level_id = jl.id AND lt.locale = $1
     LEFT JOIN onboarding_tasks asset ON asset.employee_id = e.id AND asset.task_code = 'ASSET_ASSIGNMENT'
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS asset_count
       FROM asset_assignments aa
       WHERE aa.employee_id = e.id AND aa.assignment_status = 'ACTIVE' AND aa.returned_at IS NULL
     ) active_assets ON TRUE
     LEFT JOIN LATERAL (
       SELECT event_type, note, created_at
       FROM onboarding_asset_gate_events ev
       WHERE ev.employee_id = e.id
       ORDER BY ev.created_at DESC, ev.id DESC LIMIT 1
     ) latest ON TRUE
     WHERE e.archived_at IS NULL
       AND oc.case_status = ANY($2::text[])
     ORDER BY CASE oc.case_status WHEN 'HR_APPROVED' THEN 0 ELSE 1 END,
              oc.updated_at DESC, e.employee_code`,
    [locale, GATE_STATUSES]
  );
  return result.rows;
}

export async function getAssetGateCase(employeeId) {
  const result = await db.query(
    `SELECT oc.*, e.employee_code, e.first_name, e.last_name, e.nickname,
            e.company_email, e.employee_status, e.profile_status, e.start_date,
            asset.task_status AS asset_task_status, asset.completed_at AS asset_task_completed_at,
            asset.metadata AS asset_task_metadata
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     LEFT JOIN onboarding_tasks asset ON asset.employee_id = e.id AND asset.task_code = 'ASSET_ASSIGNMENT'
     WHERE oc.employee_id = $1 AND e.archived_at IS NULL LIMIT 1`,
    [employeeId]
  );
  return result.rows[0] || null;
}

export async function listAssetGateHistory(employeeId) {
  const result = await db.query(
    `SELECT id, onboarding_case_id, employee_id, event_type, asset_id, asset_assignment_id,
            actor_user_id, note, metadata, created_at
     FROM onboarding_asset_gate_events
     WHERE employee_id = $1
     ORDER BY created_at DESC, id DESC`,
    [employeeId]
  );
  return result.rows;
}

export async function assertAssetGateOpen(employeeId) {
  const row = await getAssetGateCase(employeeId);
  if (!row) throw gateError('Onboarding case was not found.', 404, 'ONBOARDING_CASE_NOT_FOUND');
  if (row.case_status !== 'HR_APPROVED') {
    throw gateError('Asset Gate is only editable after HR approval and before the gate is completed.');
  }
  return row;
}

export async function recordAssetGateEvent({ employeeId, eventType, actorUserId = null, assetId = null, assignmentId = null, note = null, metadata = {} }) {
  const gate = await getAssetGateCase(employeeId);
  if (!gate) throw gateError('Onboarding case was not found.', 404, 'ONBOARDING_CASE_NOT_FOUND');
  await db.query(
    `INSERT INTO onboarding_asset_gate_events (
       onboarding_case_id, employee_id, event_type, asset_id, asset_assignment_id,
       actor_user_id, note, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
    [gate.id, employeeId, eventType, assetId, assignmentId, actorUserId, note, JSON.stringify(metadata || {})]
  );
}

async function lockOpenGate(client, employeeId) {
  const result = await client.query(
    `SELECT oc.id AS onboarding_case_id, oc.case_status,
            e.id AS employee_id, e.employee_code, e.first_name, e.last_name, e.company_email
     FROM onboarding_cases oc
     INNER JOIN employees e ON e.id = oc.employee_id
     WHERE e.id = $1 AND e.archived_at IS NULL
     FOR UPDATE OF oc, e`,
    [employeeId]
  );
  const row = result.rows[0];
  if (!row) throw gateError('Onboarding case was not found.', 404, 'ONBOARDING_CASE_NOT_FOUND');
  if (row.case_status !== 'HR_APPROVED') throw gateError('Asset Gate is not open for this employee.');
  return row;
}

function employeeEmailTarget(companyEmail) {
  if (!companyEmail) return [];
  return [{ channel: 'EMAIL', targetType: 'EMAIL', targetValue: companyEmail, recipientEmail: companyEmail }];
}

async function finishGate(client, row, { actorUserId, decision, note, assetCount = 0 }) {
  await client.query(
    `UPDATE onboarding_tasks
     SET task_status = 'COMPLETED', completed_at = COALESCE(completed_at, NOW()),
         metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
         updated_at = NOW()
     WHERE employee_id = $1 AND task_code = $2`,
    [row.employee_id, 'ASSET_ASSIGNMENT', JSON.stringify({ decision, asset_count: assetCount, note })]
  );
  await client.query(
    `UPDATE onboarding_cases
     SET case_status = 'ASSET_COMPLETED',
         metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [row.onboarding_case_id, JSON.stringify({ asset_gate_decision: decision, asset_count: assetCount, asset_gate_note: note })]
  );
  await client.query(
    `INSERT INTO onboarding_asset_gate_events (
       onboarding_case_id, employee_id, event_type, actor_user_id, note, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
    [row.onboarding_case_id, row.employee_id, decision, actorUserId, note, JSON.stringify({ asset_count: assetCount })]
  );
  await createWorkflowNotification(client, {
    eventCode: 'EMPLOYEE_ONBOARDING_ASSET_GATE_COMPLETED',
    sourceModule: 'HRM',
    entityType: 'ONBOARDING_CASE',
    entityId: row.onboarding_case_id,
    payload: {
      employee_id: row.employee_id,
      employee_code: row.employee_code,
      employee_name: [row.first_name, row.last_name].filter(Boolean).join(' '),
      company_email: row.company_email,
      decision,
      asset_count: assetCount,
      next_step: 'ACTIVATION',
    },
    targets: employeeEmailTarget(row.company_email),
  });
}

export async function completeGateWithAssets({ employeeId, actorUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = await lockOpenGate(client, employeeId);
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS asset_count
       FROM asset_assignments
       WHERE employee_id = $1 AND assignment_status = 'ACTIVE' AND returned_at IS NULL`,
      [employeeId]
    );
    const assetCount = Number(countResult.rows[0]?.asset_count || 0);
    if (assetCount < 1) throw gateError('Assign at least one asset, or choose No Asset Required.');
    await finishGate(client, row, { actorUserId, decision: 'ASSETS_ASSIGNED', note, assetCount });
    await client.query('COMMIT');
    return { employee_id: employeeId, case_status: 'ASSET_COMPLETED', decision: 'ASSETS_ASSIGNED', asset_count: assetCount, next_step: 'ACTIVATION' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function completeGateWithoutAssets({ employeeId, actorUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const row = await lockOpenGate(client, employeeId);
    const countResult = await client.query(
      `SELECT COUNT(*)::int AS asset_count
       FROM asset_assignments
       WHERE employee_id = $1 AND assignment_status = 'ACTIVE' AND returned_at IS NULL`,
      [employeeId]
    );
    const assetCount = Number(countResult.rows[0]?.asset_count || 0);
    if (assetCount > 0) throw gateError('This employee already has assigned assets. Complete the gate with assigned assets instead.');
    await finishGate(client, row, { actorUserId, decision: 'NO_ASSET_REQUIRED', note, assetCount: 0 });
    await client.query('COMMIT');
    return { employee_id: employeeId, case_status: 'ASSET_COMPLETED', decision: 'NO_ASSET_REQUIRED', asset_count: 0, next_step: 'ACTIVATION' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

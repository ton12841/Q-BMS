import { db } from '../../../config/database/postgres.js';

export async function withReportingLineTransaction(work) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* keep original error */ }
    throw error;
  } finally {
    client.release();
  }
}

export async function listCurrentEmployeeAssignments({ locale = 'en', executor = db } = {}) {
  const result = await executor.query(`
    SELECT
      ea.id AS assignment_id,
      ea.employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      e.employee_status,
      ea.business_unit_id,
      bu.code AS business_unit_code,
      COALESCE(but.name, bu.name) AS business_unit_name,
      ea.position_id,
      p.code AS position_code,
      COALESCE(pt.name, p.name) AS position_name,
      ea.job_grade_id,
      g.grade_number,
      COALESCE(gt.name, g.name) AS job_grade_name,
      g.job_level_id,
      l.code AS job_level_code,
      COALESCE(lt.name, l.name) AS job_level_name,
      ea.effective_from,
      ea.effective_to
    FROM employee_assignments ea
    JOIN employees e ON e.id = ea.employee_id
    JOIN business_units bu ON bu.id = ea.business_unit_id
    JOIN positions p ON p.id = ea.position_id
    JOIN job_grades g ON g.id = ea.job_grade_id
    JOIN job_levels l ON l.id = g.job_level_id
    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = bu.id AND but.locale = $1
    LEFT JOIN position_translations pt
      ON pt.position_id = p.id AND pt.locale = $1
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = g.id AND gt.locale = $1
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = l.id AND lt.locale = $1
    WHERE e.archived_at IS NULL
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
    ORDER BY
      l.sort_order,
      g.sort_order,
      e.employee_code NULLS LAST,
      e.first_name,
      e.last_name,
      ea.id
  `, [locale]);

  return result.rows;
}

export async function listReportingLines({ locale = 'en', executor = db } = {}) {
  const result = await executor.query(`
    SELECT
      rl.id,
      rl.employee_assignment_id,
      rl.reports_to_assignment_id,
      rl.relationship_type,
      rl.status,
      rl.effective_from,
      rl.effective_to,
      rl.created_at,
      rl.updated_at,

      child.employee_id AS employee_id,
      ce.employee_code,
      ce.first_name,
      ce.last_name,
      ce.nickname,
      child.business_unit_id,
      cbu.code AS business_unit_code,
      COALESCE(cbut.name, cbu.name) AS business_unit_name,
      child.position_id,
      cp.code AS position_code,
      COALESCE(cpt.name, cp.name) AS position_name,
      child.job_grade_id,
      cg.grade_number,
      COALESCE(cgt.name, cg.name) AS job_grade_name,
      cl.code AS job_level_code,
      COALESCE(clt.name, cl.name) AS job_level_name,

      manager.employee_id AS manager_employee_id,
      me.employee_code AS manager_employee_code,
      me.first_name AS manager_first_name,
      me.last_name AS manager_last_name,
      me.nickname AS manager_nickname,
      manager.business_unit_id AS manager_business_unit_id,
      mbu.code AS manager_business_unit_code,
      COALESCE(mbut.name, mbu.name) AS manager_business_unit_name,
      manager.position_id AS manager_position_id,
      mp.code AS manager_position_code,
      COALESCE(mpt.name, mp.name) AS manager_position_name,
      manager.job_grade_id AS manager_job_grade_id,
      mg.grade_number AS manager_grade_number,
      COALESCE(mgt.name, mg.name) AS manager_job_grade_name,
      ml.code AS manager_job_level_code,
      COALESCE(mlt.name, ml.name) AS manager_job_level_name

    FROM employee_reporting_lines rl
    JOIN employee_assignments child ON child.id = rl.employee_assignment_id
    JOIN employees ce ON ce.id = child.employee_id
    JOIN business_units cbu ON cbu.id = child.business_unit_id
    JOIN positions cp ON cp.id = child.position_id
    JOIN job_grades cg ON cg.id = child.job_grade_id
    JOIN job_levels cl ON cl.id = cg.job_level_id

    JOIN employee_assignments manager ON manager.id = rl.reports_to_assignment_id
    JOIN employees me ON me.id = manager.employee_id
    JOIN business_units mbu ON mbu.id = manager.business_unit_id
    JOIN positions mp ON mp.id = manager.position_id
    JOIN job_grades mg ON mg.id = manager.job_grade_id
    JOIN job_levels ml ON ml.id = mg.job_level_id

    LEFT JOIN business_unit_translations cbut ON cbut.business_unit_id = cbu.id AND cbut.locale = $1
    LEFT JOIN position_translations cpt ON cpt.position_id = cp.id AND cpt.locale = $1
    LEFT JOIN job_grade_translations cgt ON cgt.job_grade_id = cg.id AND cgt.locale = $1
    LEFT JOIN job_level_translations clt ON clt.job_level_id = cl.id AND clt.locale = $1

    LEFT JOIN business_unit_translations mbut ON mbut.business_unit_id = mbu.id AND mbut.locale = $1
    LEFT JOIN position_translations mpt ON mpt.position_id = mp.id AND mpt.locale = $1
    LEFT JOIN job_grade_translations mgt ON mgt.job_grade_id = mg.id AND mgt.locale = $1
    LEFT JOIN job_level_translations mlt ON mlt.job_level_id = ml.id AND mlt.locale = $1

    ORDER BY
      CASE WHEN rl.status = 'ACTIVE' AND rl.effective_to IS NULL THEN 0 ELSE 1 END,
      rl.effective_from DESC NULLS LAST,
      rl.id DESC
  `, [locale]);

  return result.rows;
}

export async function getReportingLineById({ id, locale = 'en', executor = db }) {
  const result = await executor.query(`
    SELECT
      rl.id,
      rl.employee_assignment_id,
      rl.reports_to_assignment_id,
      rl.relationship_type,
      rl.status,
      rl.effective_from,
      rl.effective_to,
      rl.created_at,
      rl.updated_at,

      child.employee_id AS employee_id,
      ce.employee_code,
      ce.first_name,
      ce.last_name,
      ce.nickname,
      child.business_unit_id,
      cbu.code AS business_unit_code,
      COALESCE(cbut.name, cbu.name) AS business_unit_name,
      child.position_id,
      cp.code AS position_code,
      COALESCE(cpt.name, cp.name) AS position_name,
      child.job_grade_id,
      cg.grade_number,
      COALESCE(cgt.name, cg.name) AS job_grade_name,
      cl.code AS job_level_code,
      COALESCE(clt.name, cl.name) AS job_level_name,

      manager.employee_id AS manager_employee_id,
      me.employee_code AS manager_employee_code,
      me.first_name AS manager_first_name,
      me.last_name AS manager_last_name,
      me.nickname AS manager_nickname,
      manager.business_unit_id AS manager_business_unit_id,
      mbu.code AS manager_business_unit_code,
      COALESCE(mbut.name, mbu.name) AS manager_business_unit_name,
      manager.position_id AS manager_position_id,
      mp.code AS manager_position_code,
      COALESCE(mpt.name, mp.name) AS manager_position_name,
      manager.job_grade_id AS manager_job_grade_id,
      mg.grade_number AS manager_grade_number,
      COALESCE(mgt.name, mg.name) AS manager_job_grade_name,
      ml.code AS manager_job_level_code,
      COALESCE(mlt.name, ml.name) AS manager_job_level_name

    FROM employee_reporting_lines rl
    JOIN employee_assignments child ON child.id = rl.employee_assignment_id
    JOIN employees ce ON ce.id = child.employee_id
    JOIN business_units cbu ON cbu.id = child.business_unit_id
    JOIN positions cp ON cp.id = child.position_id
    JOIN job_grades cg ON cg.id = child.job_grade_id
    JOIN job_levels cl ON cl.id = cg.job_level_id
    JOIN employee_assignments manager ON manager.id = rl.reports_to_assignment_id
    JOIN employees me ON me.id = manager.employee_id
    JOIN business_units mbu ON mbu.id = manager.business_unit_id
    JOIN positions mp ON mp.id = manager.position_id
    JOIN job_grades mg ON mg.id = manager.job_grade_id
    JOIN job_levels ml ON ml.id = mg.job_level_id
    LEFT JOIN business_unit_translations cbut ON cbut.business_unit_id = cbu.id AND cbut.locale = $2
    LEFT JOIN position_translations cpt ON cpt.position_id = cp.id AND cpt.locale = $2
    LEFT JOIN job_grade_translations cgt ON cgt.job_grade_id = cg.id AND cgt.locale = $2
    LEFT JOIN job_level_translations clt ON clt.job_level_id = cl.id AND clt.locale = $2
    LEFT JOIN business_unit_translations mbut ON mbut.business_unit_id = mbu.id AND mbut.locale = $2
    LEFT JOIN position_translations mpt ON mpt.position_id = mp.id AND mpt.locale = $2
    LEFT JOIN job_grade_translations mgt ON mgt.job_grade_id = mg.id AND mgt.locale = $2
    LEFT JOIN job_level_translations mlt ON mlt.job_level_id = ml.id AND mlt.locale = $2
    WHERE rl.id = $1
  `, [id, locale]);

  return result.rows[0] || null;
}

export async function getCurrentAssignmentById(id, executor = db) {
  const result = await executor.query(`
    SELECT
      ea.id,
      ea.employee_id,
      ea.effective_from,
      ea.business_unit_id,
      ea.position_id,
      ea.job_grade_id
    FROM employee_assignments ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.id = $1
      AND e.archived_at IS NULL
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
    FOR UPDATE OF ea
  `, [id]);

  return result.rows[0] || null;
}

export async function listActiveReportingEdges(executor = db) {
  const result = await executor.query(`
    SELECT
      employee_assignment_id,
      reports_to_assignment_id
    FROM employee_reporting_lines
    WHERE status = 'ACTIVE'
      AND effective_to IS NULL
  `);
  return result.rows;
}

export async function getActiveReportingPair({ employeeAssignmentId, reportsToAssignmentId, executor = db }) {
  const result = await executor.query(`
    SELECT *
    FROM employee_reporting_lines
    WHERE employee_assignment_id = $1
      AND reports_to_assignment_id = $2
      AND status = 'ACTIVE'
      AND effective_to IS NULL
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [employeeAssignmentId, reportsToAssignmentId]);
  return result.rows[0] || null;
}

export async function getCurrentPrimaryReportingLine(employeeAssignmentId, executor = db) {
  const result = await executor.query(`
    SELECT *
    FROM employee_reporting_lines
    WHERE employee_assignment_id = $1
      AND relationship_type = 'PRIMARY'
      AND status = 'ACTIVE'
      AND effective_to IS NULL
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `, [employeeAssignmentId]);
  return result.rows[0] || null;
}

export async function getReportingLineForUpdate(id, executor = db) {
  const result = await executor.query(`
    SELECT *
    FROM employee_reporting_lines
    WHERE id = $1
    FOR UPDATE
  `, [id]);
  return result.rows[0] || null;
}

export async function endReportingLineRecord({ id, effectiveTo, executor }) {
  const result = await executor.query(`
    UPDATE employee_reporting_lines
    SET
      status = 'INACTIVE',
      effective_to = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, effectiveTo]);
  return result.rows[0] || null;
}

export async function insertReportingLineRecord({
  employeeAssignmentId,
  reportsToAssignmentId,
  relationshipType,
  effectiveFrom,
  executor,
}) {
  const result = await executor.query(`
    INSERT INTO employee_reporting_lines (
      employee_assignment_id,
      reports_to_assignment_id,
      relationship_type,
      status,
      effective_from,
      effective_to
    )
    VALUES ($1, $2, $3, 'ACTIVE', $4, NULL)
    RETURNING *
  `, [employeeAssignmentId, reportsToAssignmentId, relationshipType, effectiveFrom]);
  return result.rows[0];
}

export async function syncLegacyPrimaryManager({ employeeAssignmentId, reportsToAssignmentId = null, executor }) {
  await executor.query(`
    UPDATE employees employee
    SET
      manager_employee_id = CASE
        WHEN $2::bigint IS NULL THEN NULL
        ELSE (
          SELECT manager_assignment.employee_id
          FROM employee_assignments manager_assignment
          WHERE manager_assignment.id = $2
        )
      END,
      updated_at = NOW()
    FROM employee_assignments employee_assignment
    WHERE employee_assignment.id = $1
      AND employee.id = employee_assignment.employee_id
  `, [employeeAssignmentId, reportsToAssignmentId]);
}

export async function recordReportingLineAudit({
  actorUserId = null,
  action,
  reportingLineId,
  metadata = {},
  executor,
}) {
  await executor.query(`
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1, $2, 'REPORTING_LINE', $3, $4::jsonb)
  `, [actorUserId, action, String(reportingLineId), JSON.stringify(metadata || {})]);
}

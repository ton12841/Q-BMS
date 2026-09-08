import { db } from '../../../config/database/postgres.js';

export async function withAssignmentTransaction(callback) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getEmployeeIdentity(employeeId, executor = db) {
  const result = await executor.query(`
    SELECT
      e.id,
      e.employee_code,
      e.company_email,
      e.first_name,
      e.last_name,
      e.nickname,
      e.employee_status,
      e.employment_type,
      e.start_date,
      e.work_location
    FROM employees e
    WHERE e.id = $1
      AND e.archived_at IS NULL
  `, [employeeId]);

  return result.rows[0] || null;
}

export async function lockEmployee(employeeId, executor) {
  const result = await executor.query(`
    SELECT
      id,
      employee_code,
      first_name,
      last_name,
      nickname,
      employee_status
    FROM employees
    WHERE id = $1
      AND archived_at IS NULL
    FOR UPDATE
  `, [employeeId]);

  return result.rows[0] || null;
}

export async function getCurrentAssignmentForUpdate(employeeId, executor) {
  const result = await executor.query(`
    SELECT
      ea.*
    FROM employee_assignments ea
    WHERE ea.employee_id = $1
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
    ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC
    LIMIT 1
    FOR UPDATE
  `, [employeeId]);

  return result.rows[0] || null;
}

export async function validateAssignmentChoice({
  businessUnitId,
  positionId,
  jobGradeId,
  executor = db,
}) {
  const result = await executor.query(`
    SELECT
      EXISTS (
        SELECT 1
        FROM business_units
        WHERE id = $1
          AND status = 'ACTIVE'
      ) AS business_unit_exists,

      EXISTS (
        SELECT 1
        FROM positions
        WHERE id = $2
          AND status = 'ACTIVE'
      ) AS position_exists,

      EXISTS (
        SELECT 1
        FROM job_grades
        WHERE id = $3
          AND status = 'ACTIVE'
      ) AS job_grade_exists,

      EXISTS (
        SELECT 1
        FROM position_job_grades
        WHERE position_id = $2
          AND job_grade_id = $3
      ) AS position_grade_allowed
  `, [businessUnitId, positionId, jobGradeId]);

  return result.rows[0];
}

export async function listEmployeeAssignments({
  employeeId,
  locale = 'en',
  executor = db,
}) {
  const result = await executor.query(`
    SELECT
      ea.id AS assignment_id,
      ea.employee_id,
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

      ea.is_primary,
      ea.assignment_status,
      ea.effective_from,
      ea.effective_to,
      ea.change_type,
      ea.change_reason,
      ea.change_note,
      ea.created_by_user_id,
      ea.created_at,
      ea.updated_at,

      creator.email AS created_by_email,

      primary_line.id AS primary_reporting_line_id,
      primary_line.status AS primary_reporting_line_status,
      primary_line.effective_from AS primary_reporting_effective_from,
      primary_line.effective_to AS primary_reporting_effective_to,

      manager_assignment.id AS manager_assignment_id,
      manager.id AS manager_employee_id,
      manager.employee_code AS manager_employee_code,
      manager.first_name AS manager_first_name,
      manager.last_name AS manager_last_name,
      manager.nickname AS manager_nickname,
      manager_bu.code AS manager_business_unit_code,
      COALESCE(manager_but.name, manager_bu.name) AS manager_business_unit_name,
      manager_position.code AS manager_position_code,
      COALESCE(manager_pt.name, manager_position.name) AS manager_position_name

    FROM employee_assignments ea
    JOIN business_units bu ON bu.id = ea.business_unit_id
    JOIN positions p ON p.id = ea.position_id
    JOIN job_grades g ON g.id = ea.job_grade_id
    JOIN job_levels l ON l.id = g.job_level_id

    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = bu.id
     AND but.locale = $2

    LEFT JOIN position_translations pt
      ON pt.position_id = p.id
     AND pt.locale = $2

    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = g.id
     AND gt.locale = $2

    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = l.id
     AND lt.locale = $2

    LEFT JOIN users creator
      ON creator.id = ea.created_by_user_id

    LEFT JOIN LATERAL (
      SELECT rl.*
      FROM employee_reporting_lines rl
      WHERE rl.employee_assignment_id = ea.id
        AND rl.relationship_type = 'PRIMARY'
      ORDER BY
        CASE
          WHEN rl.status = 'ACTIVE' AND rl.effective_to IS NULL THEN 0
          ELSE 1
        END,
        rl.effective_from DESC NULLS LAST,
        rl.id DESC
      LIMIT 1
    ) primary_line ON TRUE

    LEFT JOIN employee_assignments manager_assignment
      ON manager_assignment.id = primary_line.reports_to_assignment_id

    LEFT JOIN employees manager
      ON manager.id = manager_assignment.employee_id

    LEFT JOIN business_units manager_bu
      ON manager_bu.id = manager_assignment.business_unit_id

    LEFT JOIN business_unit_translations manager_but
      ON manager_but.business_unit_id = manager_bu.id
     AND manager_but.locale = $2

    LEFT JOIN positions manager_position
      ON manager_position.id = manager_assignment.position_id

    LEFT JOIN position_translations manager_pt
      ON manager_pt.position_id = manager_position.id
     AND manager_pt.locale = $2

    WHERE ea.employee_id = $1
      AND ea.is_primary = TRUE

    ORDER BY
      CASE
        WHEN ea.assignment_status = 'ACTIVE' AND ea.effective_to IS NULL THEN 0
        ELSE 1
      END,
      ea.effective_from DESC NULLS LAST,
      ea.id DESC
  `, [employeeId, locale]);

  return result.rows;
}

export async function listManagerCandidates({
  employeeId,
  locale = 'en',
  executor = db,
}) {
  const result = await executor.query(`
    SELECT
      ea.id AS assignment_id,
      e.id AS employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      bu.code AS business_unit_code,
      COALESCE(but.name, bu.name) AS business_unit_name,
      p.code AS position_code,
      COALESCE(pt.name, p.name) AS position_name,
      g.grade_number,
      COALESCE(gt.name, g.name) AS job_grade_name,
      l.code AS job_level_code,
      COALESCE(lt.name, l.name) AS job_level_name
    FROM employee_assignments ea
    JOIN employees e ON e.id = ea.employee_id
    JOIN business_units bu ON bu.id = ea.business_unit_id
    JOIN positions p ON p.id = ea.position_id
    JOIN job_grades g ON g.id = ea.job_grade_id
    JOIN job_levels l ON l.id = g.job_level_id
    LEFT JOIN business_unit_translations but
      ON but.business_unit_id = bu.id AND but.locale = $2
    LEFT JOIN position_translations pt
      ON pt.position_id = p.id AND pt.locale = $2
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = g.id AND gt.locale = $2
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = l.id AND lt.locale = $2
    WHERE e.archived_at IS NULL
      AND e.id <> $1
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
    ORDER BY
      COALESCE(but.name, bu.name),
      COALESCE(pt.name, p.name),
      g.grade_number,
      e.employee_code
  `, [employeeId, locale]);

  return result.rows;
}

export async function getActiveAssignmentById(id, executor = db) {
  const result = await executor.query(`
    SELECT
      ea.id,
      ea.employee_id,
      ea.business_unit_id,
      ea.position_id,
      ea.job_grade_id,
      ea.effective_from
    FROM employee_assignments ea
    JOIN employees e ON e.id = ea.employee_id
    WHERE ea.id = $1
      AND e.archived_at IS NULL
      AND ea.is_primary = TRUE
      AND ea.assignment_status = 'ACTIVE'
      AND ea.effective_to IS NULL
  `, [id]);

  return result.rows[0] || null;
}

export async function listActiveOutgoingLines(assignmentId, executor = db) {
  const result = await executor.query(`
    SELECT *
    FROM employee_reporting_lines
    WHERE employee_assignment_id = $1
      AND status = 'ACTIVE'
      AND effective_to IS NULL
    ORDER BY relationship_type, id
    FOR UPDATE
  `, [assignmentId]);

  return result.rows;
}

export async function listActiveIncomingLines(assignmentId, executor = db) {
  const result = await executor.query(`
    SELECT *
    FROM employee_reporting_lines
    WHERE reports_to_assignment_id = $1
      AND status = 'ACTIVE'
      AND effective_to IS NULL
    ORDER BY relationship_type, id
    FOR UPDATE
  `, [assignmentId]);

  return result.rows;
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

export async function closeReportingLines(ids, effectiveTo, executor) {
  if (!ids.length) return [];

  const result = await executor.query(`
    UPDATE employee_reporting_lines
    SET
      status = 'INACTIVE',
      effective_to = $2,
      updated_at = NOW()
    WHERE id = ANY($1::bigint[])
    RETURNING *
  `, [ids, effectiveTo]);

  return result.rows;
}

export async function closeAssignment(id, effectiveTo, executor) {
  const result = await executor.query(`
    UPDATE employee_assignments
    SET
      assignment_status = 'INACTIVE',
      effective_to = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, effectiveTo]);

  return result.rows[0] || null;
}

export async function insertAssignment({
  employeeId,
  businessUnitId,
  positionId,
  jobGradeId,
  effectiveFrom,
  changeType,
  changeReason,
  changeNote,
  actorUserId,
  executor,
}) {
  const result = await executor.query(`
    INSERT INTO employee_assignments (
      employee_id,
      business_unit_id,
      position_id,
      job_grade_id,
      department_id,
      is_primary,
      assignment_status,
      effective_from,
      effective_to,
      change_type,
      change_reason,
      change_note,
      created_by_user_id
    )
    VALUES (
      $1, $2, $3, $4,
      NULL,
      TRUE,
      'ACTIVE',
      $5,
      NULL,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *
  `, [
    employeeId,
    businessUnitId,
    positionId,
    jobGradeId,
    effectiveFrom,
    changeType,
    changeReason,
    changeNote,
    actorUserId,
  ]);

  return result.rows[0];
}

export async function insertReportingLine({
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
  `, [
    employeeAssignmentId,
    reportsToAssignmentId,
    relationshipType,
    effectiveFrom,
  ]);

  return result.rows[0];
}

export async function syncLegacyOrganizationFields({
  employeeId,
  assignment,
  primaryManagerAssignmentId = null,
  executor,
}) {
  const result = await executor.query(`
    UPDATE employees
    SET
      primary_business_unit_id = $2,
      position_id = $3,
      job_level = (
        SELECT l.code
        FROM job_grades g
        JOIN job_levels l ON l.id = g.job_level_id
        WHERE g.id = $4
      ),
      manager_employee_id = CASE
        WHEN $5::bigint IS NULL THEN NULL
        ELSE (
          SELECT manager_assignment.employee_id
          FROM employee_assignments manager_assignment
          WHERE manager_assignment.id = $5
        )
      END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [
    employeeId,
    assignment.business_unit_id,
    assignment.position_id,
    assignment.job_grade_id,
    primaryManagerAssignmentId,
  ]);

  return result.rows[0] || null;
}

export async function recordAssignmentAudit({
  actorUserId = null,
  action,
  assignmentId,
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
    VALUES ($1, $2, 'EMPLOYEE_ASSIGNMENT', $3, $4::jsonb)
  `, [
    actorUserId,
    action,
    String(assignmentId),
    JSON.stringify(metadata || {}),
  ]);
}

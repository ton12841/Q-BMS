import { db } from '../../../config/database/postgres.js';

export async function listOrganizationChartAssignments({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      ea.id AS assignment_id,
      ea.employee_id,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      e.work_location,
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
      ea.effective_from
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
      AND COALESCE(e.is_test_account, FALSE) = FALSE
      AND e.employee_status = 'ACTIVE'
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

export async function listOrganizationChartEdges() {
  const result = await db.query(`
    SELECT
      rl.id,
      rl.employee_assignment_id,
      rl.reports_to_assignment_id,
      rl.relationship_type,
      rl.effective_from
    FROM employee_reporting_lines rl
    JOIN employee_assignments child
      ON child.id = rl.employee_assignment_id
    JOIN employee_assignments manager
      ON manager.id = rl.reports_to_assignment_id
    WHERE rl.status = 'ACTIVE'
      AND rl.effective_to IS NULL
      AND child.assignment_status = 'ACTIVE'
      AND child.effective_to IS NULL
      AND manager.assignment_status = 'ACTIVE'
      AND manager.effective_to IS NULL
    ORDER BY rl.relationship_type, rl.id
  `);

  return result.rows;
}

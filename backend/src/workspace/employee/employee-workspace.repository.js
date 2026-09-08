import { db } from '../../config/database/postgres.js';

export async function getEmployeeWorkspace(employeeId, locale = 'en') {
  const employeeResult = await db.query(
    `SELECT
       e.id,
       e.employee_code,
       e.company_email,
       e.first_name,
       e.last_name,
       e.nickname,
       e.employment_type,
       e.employee_status,
       e.profile_status,
       e.work_location,
       e.start_date,
       e.probation_end_date,
       e.contract_end_date,
       e.created_at,
       e.updated_at,
       p.mobile,
       p.personal_email,
       p.nationality,
       p.date_of_birth,
       ec.contact_name AS emergency_contact_name,
       ec.relationship AS emergency_relationship,
       ec.phone AS emergency_phone,
       bank.bank_name,
       bank.account_name AS bank_account_name,
       CASE
         WHEN bank.account_number IS NULL OR BTRIM(bank.account_number) = '' THEN NULL
         WHEN LENGTH(bank.account_number) <= 4 THEN bank.account_number
         ELSE REPEAT('•', GREATEST(LENGTH(bank.account_number) - 4, 4)) || RIGHT(bank.account_number, 4)
       END AS bank_account_masked,
       a.assignment_id,
       a.effective_from AS assignment_effective_from,
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
       COALESCE(reporting_manager.employee_code, legacy_manager.employee_code) AS manager_employee_code,
       COALESCE(reporting_manager.first_name, legacy_manager.first_name) AS manager_first_name,
       COALESCE(reporting_manager.last_name, legacy_manager.last_name) AS manager_last_name,
       COALESCE(reporting_manager.nickname, legacy_manager.nickname) AS manager_nickname,
       CASE
         WHEN reporting_manager.employee_id IS NOT NULL THEN 'REPORTING_LINE'
         WHEN legacy_manager.id IS NOT NULL THEN 'LEGACY_MANAGER_FALLBACK'
         ELSE NULL
       END AS manager_source,
       oc.completed_at AS onboarding_completed_at,
       activation.created_at AS activated_at
     FROM employees e
     LEFT JOIN employee_profile_details p ON p.employee_id = e.id
     LEFT JOIN employee_emergency_contacts ec
       ON ec.employee_id = e.id AND ec.is_primary = TRUE
     LEFT JOIN employee_bank_accounts bank
       ON bank.employee_id = e.id AND bank.is_primary = TRUE
     LEFT JOIN onboarding_cases oc ON oc.employee_id = e.id
     LEFT JOIN LATERAL (
       SELECT ae.created_at
       FROM onboarding_activation_events ae
       WHERE ae.employee_id = e.id AND ae.event_type = 'ACTIVATED'
       ORDER BY ae.created_at DESC, ae.id DESC
       LIMIT 1
     ) activation ON TRUE
     LEFT JOIN LATERAL (
       SELECT
         ea.id AS assignment_id,
         ea.business_unit_id,
         bu.code AS business_unit_code,
         bu.name AS business_unit_base_name,
         ea.position_id,
         pos.code AS position_code,
         pos.name AS position_base_name,
         ea.job_grade_id,
         grade.grade_number,
         grade.name AS job_grade_base_name,
         grade.job_level_id,
         level.code AS job_level_code,
         level.name AS job_level_base_name,
         ea.effective_from
       FROM employee_assignments ea
       JOIN business_units bu ON bu.id = ea.business_unit_id
       JOIN positions pos ON pos.id = ea.position_id
       JOIN job_grades grade ON grade.id = ea.job_grade_id
       JOIN job_levels level ON level.id = grade.job_level_id
       WHERE ea.employee_id = e.id
         AND ea.is_primary = TRUE
         AND ea.assignment_status = 'ACTIVE'
         AND ea.effective_to IS NULL
       ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC
       LIMIT 1
     ) a ON TRUE
     LEFT JOIN business_unit_translations but
       ON but.business_unit_id = a.business_unit_id AND but.locale = $2
     LEFT JOIN position_translations pt
       ON pt.position_id = a.position_id AND pt.locale = $2
     LEFT JOIN job_grade_translations gt
       ON gt.job_grade_id = a.job_grade_id AND gt.locale = $2
     LEFT JOIN job_level_translations lt
       ON lt.job_level_id = a.job_level_id AND lt.locale = $2
     LEFT JOIN LATERAL (
       SELECT
         manager_employee.id AS employee_id,
         manager_employee.employee_code,
         manager_employee.first_name,
         manager_employee.last_name,
         manager_employee.nickname
       FROM employee_reporting_lines reporting_line
       JOIN employee_assignments manager_assignment
         ON manager_assignment.id = reporting_line.reports_to_assignment_id
       JOIN employees manager_employee
         ON manager_employee.id = manager_assignment.employee_id
       WHERE reporting_line.employee_assignment_id = a.assignment_id
         AND reporting_line.relationship_type = 'PRIMARY'
         AND reporting_line.status = 'ACTIVE'
         AND reporting_line.effective_to IS NULL
         AND manager_employee.archived_at IS NULL
       ORDER BY reporting_line.effective_from DESC NULLS LAST, reporting_line.id DESC
       LIMIT 1
     ) reporting_manager ON TRUE
     LEFT JOIN employees legacy_manager
       ON legacy_manager.id = e.manager_employee_id
      AND legacy_manager.archived_at IS NULL
     WHERE e.id = $1
       AND e.archived_at IS NULL
     LIMIT 1`,
    [employeeId, locale]
  );

  const employee = employeeResult.rows[0] || null;
  if (!employee) return null;

  const [documentsResult, assetsResult] = await Promise.all([
    db.query(
      `SELECT
         id,
         document_type,
         document_url,
         COALESCE(status, 'SUBMITTED') AS status,
         created_at,
         updated_at
       FROM employee_documents
       WHERE employee_id = $1
         AND COALESCE(status, 'SUBMITTED') <> 'ARCHIVED'
       ORDER BY created_at DESC NULLS LAST, id DESC`,
      [employeeId]
    ),
    db.query(
      `SELECT
         aa.id AS assignment_id,
         aa.assigned_at,
         aa.notes AS assignment_notes,
         a.id AS asset_id,
         a.asset_code,
         a.asset_name,
         a.asset_type,
         a.serial_number,
         a.status AS asset_status
       FROM asset_assignments aa
       JOIN assets a ON a.id = aa.asset_id
       WHERE aa.employee_id = $1
         AND aa.assignment_status = 'ACTIVE'
         AND aa.returned_at IS NULL
       ORDER BY aa.assigned_at DESC, aa.id DESC`,
      [employeeId]
    ),
  ]);

  return {
    employee,
    documents: documentsResult.rows,
    assets: assetsResult.rows,
  };
}

import { db } from '../../../config/database/postgres.js';
import { createWorkflowNotification } from '../../notification/notification.repository.js';

const EMPLOYEE_TASKS = [
  ['PERSONAL_INFORMATION', 'Personal Information', 'EMPLOYEE'],
  ['EMERGENCY_CONTACT', 'Emergency Contact', 'EMPLOYEE'],
  ['BANK_INFORMATION', 'Bank Information', 'EMPLOYEE'],
  ['PERSONAL_DOCUMENTS', 'Personal Documents', 'EMPLOYEE'],
  ['COMPANY_POLICY', 'Company Policy', 'EMPLOYEE'],
  ['IT_ACCOUNT_SETUP', 'Company Account Setup', 'IT'],
  ['HR_REVIEW', 'HR Review', 'HR'],
  ['ASSET_ASSIGNMENT', 'Asset Assignment', 'ADMIN'],
  ['ACTIVATION', 'Employee Activation', 'HR'],
];

async function ensureCase(client, employeeId) {
  const inserted = await client.query(
    `INSERT INTO onboarding_cases (employee_id, case_status)
     VALUES ($1, 'IN_PROGRESS')
     ON CONFLICT (employee_id) DO UPDATE
       SET updated_at = onboarding_cases.updated_at
     RETURNING *`,
    [employeeId]
  );
  const onboardingCase = inserted.rows[0];

  for (const [taskCode, taskName, ownerType] of EMPLOYEE_TASKS) {
    await client.query(
      `INSERT INTO onboarding_tasks (
         onboarding_case_id, employee_id, task_code, task_name, owner_type, task_status
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       ON CONFLICT (employee_id, task_code) DO NOTHING`,
      [onboardingCase.id, employeeId, taskCode, taskName, ownerType]
    );
  }

  const setup = await client.query(
    `SELECT request_status, completed_at
     FROM employee_account_setup_requests
     WHERE employee_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [employeeId]
  );

  if (setup.rows[0]?.request_status === 'COMPLETED') {
    await markTask(client, employeeId, 'IT_ACCOUNT_SETUP', 'COMPLETED', {
      completed_at: setup.rows[0].completed_at || null,
    });
  }

  return onboardingCase;
}

async function markTask(client, employeeId, taskCode, status = 'COMPLETED', metadata = {}) {
  await client.query(
    `UPDATE onboarding_tasks
     SET task_status = $3,
         completed_at = CASE WHEN $3 = 'COMPLETED' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
         metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
         updated_at = NOW()
     WHERE employee_id = $1 AND task_code = $2`,
    [employeeId, taskCode, status, JSON.stringify(metadata || {})]
  );
}

async function touchProfileInProgress(client, employeeId) {
  await client.query(
    `UPDATE employees
     SET profile_status = CASE
           WHEN profile_status IS NULL OR profile_status = 'NOT_STARTED' THEN 'IN_PROGRESS'
           ELSE profile_status
         END,
         updated_at = NOW()
     WHERE id = $1`,
    [employeeId]
  );
}

export async function getEmployeeOnboarding(employeeId, locale = 'en') {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const onboardingCase = await ensureCase(client, employeeId);

    const [employeeResult, profileResult, emergencyResult, bankResult, documentResult, policyResult, taskResult] = await Promise.all([
      client.query(
        `SELECT
           e.id, e.employee_code, e.company_email, e.first_name, e.last_name, e.nickname,
           e.employee_status, e.profile_status, e.employment_type, e.start_date, e.work_location,
           a.business_unit_id, COALESCE(but.name, bu.name) AS business_unit_name,
           a.position_id, COALESCE(pt.name, p.name) AS position_name,
           a.job_grade_id, g.grade_number,
           COALESCE(gt.name, g.name) AS job_grade_name,
           COALESCE(lt.name, jl.name) AS job_level_name,
           setup.request_status AS account_setup_status,
           invitation.invitation_status,
           u.account_status AS qbms_account_status,
           u.google_subject
         FROM employees e
         LEFT JOIN LATERAL (
           SELECT ea.* FROM employee_assignments ea
           WHERE ea.employee_id = e.id AND ea.is_primary = TRUE
             AND ea.assignment_status = 'ACTIVE' AND ea.effective_to IS NULL
           ORDER BY ea.effective_from DESC NULLS LAST, ea.id DESC LIMIT 1
         ) a ON TRUE
         LEFT JOIN business_units bu ON bu.id = a.business_unit_id
         LEFT JOIN business_unit_translations but ON but.business_unit_id = bu.id AND but.locale = $2
         LEFT JOIN positions p ON p.id = a.position_id
         LEFT JOIN position_translations pt ON pt.position_id = p.id AND pt.locale = $2
         LEFT JOIN job_grades g ON g.id = a.job_grade_id
         LEFT JOIN job_grade_translations gt ON gt.job_grade_id = g.id AND gt.locale = $2
         LEFT JOIN job_levels jl ON jl.id = g.job_level_id
         LEFT JOIN job_level_translations lt ON lt.job_level_id = jl.id AND lt.locale = $2
         LEFT JOIN LATERAL (
           SELECT request_status
           FROM employee_account_setup_requests r
           WHERE r.employee_id = e.id
           ORDER BY r.created_at DESC, r.id DESC
           LIMIT 1
         ) setup ON TRUE
         LEFT JOIN LATERAL (
           SELECT invitation_status
           FROM employee_invitations i
           WHERE i.employee_id = e.id
           ORDER BY i.created_at DESC, i.id DESC
           LIMIT 1
         ) invitation ON TRUE
         LEFT JOIN users u ON u.employee_id = e.id
         WHERE e.id = $1 AND e.archived_at IS NULL`,
        [employeeId, locale]
      ),
      client.query(`SELECT * FROM employee_profile_details WHERE employee_id = $1`, [employeeId]),
      client.query(`SELECT * FROM employee_emergency_contacts WHERE employee_id = $1 AND is_primary = TRUE LIMIT 1`, [employeeId]),
      client.query(`SELECT * FROM employee_bank_accounts WHERE employee_id = $1 AND is_primary = TRUE LIMIT 1`, [employeeId]),
      client.query(
        `SELECT id, document_type, document_url, COALESCE(status, 'SUBMITTED') AS status, created_at
         FROM employee_documents
         WHERE employee_id = $1
           AND COALESCE(status, 'SUBMITTED') <> 'ARCHIVED'
         ORDER BY created_at DESC NULLS LAST, id DESC`,
        [employeeId]
      ),
      client.query(
        `SELECT policy_code, policy_version, acknowledged_at
         FROM employee_policy_acknowledgements
         WHERE employee_id = $1 AND policy_code = 'EMPLOYEE_HANDBOOK'
         ORDER BY acknowledged_at DESC LIMIT 1`,
        [employeeId]
      ),
      client.query(
        `SELECT id, task_code, task_name, owner_type, task_status, completed_at, metadata
         FROM onboarding_tasks
         WHERE employee_id = $1
         ORDER BY CASE owner_type WHEN 'EMPLOYEE' THEN 1 WHEN 'IT' THEN 2 WHEN 'HR' THEN 3 ELSE 4 END, id`,
        [employeeId]
      ),
    ]);

    const employee = employeeResult.rows[0];
    if (!employee) {
      const error = new Error('Employee record was not found for this Q BMS account.');
      error.statusCode = 404;
      throw error;
    }

    const tasks = taskResult.rows;
    const employeeTasks = tasks.filter((task) => task.owner_type === 'EMPLOYEE');
    const completedEmployee = employeeTasks.filter((task) => task.task_status === 'COMPLETED').length;
    const completedAll = tasks.filter((task) => task.task_status === 'COMPLETED').length;

    await client.query('COMMIT');
    return {
      employee,
      onboarding_case: onboardingCase,
      personal: profileResult.rows[0] || null,
      emergency: emergencyResult.rows[0] || null,
      bank: bankResult.rows[0] || null,
      documents: documentResult.rows,
      policy: policyResult.rows[0] || null,
      tasks,
      progress: employeeTasks.length ? Math.round((completedEmployee / employeeTasks.length) * 100) : 0,
      workflow_progress: tasks.length ? Math.round((completedAll / tasks.length) * 100) : 0,
      can_submit: employeeTasks.length > 0 && completedEmployee === employeeTasks.length,
      is_submitted: employee.profile_status === 'SUBMITTED' || onboardingCase.case_status === 'SUBMITTED',
    };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

export async function savePersonalInformation(employeeId, data) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await ensureCase(client, employeeId);
    await client.query(
      `UPDATE employees
       SET first_name = $2, last_name = $3, nickname = $4, updated_at = NOW()
       WHERE id = $1`,
      [employeeId, data.firstName, data.lastName, data.nickname]
    );
    await client.query(
      `INSERT INTO employee_profile_details (
         employee_id, date_of_birth, gender, nationality, national_id, mobile,
         personal_email, current_address, permanent_address
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (employee_id) DO UPDATE SET
         date_of_birth = EXCLUDED.date_of_birth,
         gender = EXCLUDED.gender,
         nationality = EXCLUDED.nationality,
         national_id = EXCLUDED.national_id,
         mobile = EXCLUDED.mobile,
         personal_email = EXCLUDED.personal_email,
         current_address = EXCLUDED.current_address,
         permanent_address = EXCLUDED.permanent_address,
         updated_at = NOW()`,
      [employeeId, data.dateOfBirth, data.gender, data.nationality, data.nationalId, data.mobile, data.personalEmail, data.currentAddress, data.permanentAddress]
    );
    await touchProfileInProgress(client, employeeId);
    await markTask(client, employeeId, 'PERSONAL_INFORMATION');
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function saveEmergencyContact(employeeId, data) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await ensureCase(client, employeeId);
    await client.query(`UPDATE employee_emergency_contacts SET is_primary = FALSE, updated_at = NOW() WHERE employee_id = $1 AND is_primary = TRUE`, [employeeId]);
    await client.query(
      `INSERT INTO employee_emergency_contacts (employee_id, contact_name, relationship, phone, alternate_phone, is_primary)
       VALUES ($1,$2,$3,$4,$5,TRUE)`,
      [employeeId, data.contactName, data.relationship, data.phone, data.alternatePhone]
    );
    await touchProfileInProgress(client, employeeId);
    await markTask(client, employeeId, 'EMERGENCY_CONTACT');
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function saveBankInformation(employeeId, data) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await ensureCase(client, employeeId);
    await client.query(`UPDATE employee_bank_accounts SET is_primary = FALSE, updated_at = NOW() WHERE employee_id = $1 AND is_primary = TRUE`, [employeeId]);
    await client.query(
      `INSERT INTO employee_bank_accounts (employee_id, bank_name, account_name, account_number, currency, bank_branch, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
      [employeeId, data.bankName, data.accountName, data.accountNumber, data.currency, data.bankBranch]
    );
    await touchProfileInProgress(client, employeeId);
    await markTask(client, employeeId, 'BANK_INFORMATION');
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function addEmployeeDocument(employeeId, data) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await ensureCase(client, employeeId);
    const result = await client.query(
      `INSERT INTO employee_documents (employee_id, document_type, document_url, status, source, created_at, updated_at)
       VALUES ($1,$2,$3,'SUBMITTED','SELF_ONBOARDING',NOW(),NOW())
       RETURNING id, document_type, document_url, status, created_at`,
      [employeeId, data.documentType, data.documentUrl]
    );
    await touchProfileInProgress(client, employeeId);
    await markTask(client, employeeId, 'PERSONAL_DOCUMENTS');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function acknowledgePolicy(employeeId) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await ensureCase(client, employeeId);
    await client.query(
      `INSERT INTO employee_policy_acknowledgements (employee_id, policy_code, policy_version)
       VALUES ($1, 'EMPLOYEE_HANDBOOK', '1.0')
       ON CONFLICT (employee_id, policy_code, policy_version)
       DO UPDATE SET acknowledged_at = NOW()`,
      [employeeId]
    );
    await touchProfileInProgress(client, employeeId);
    await markTask(client, employeeId, 'COMPANY_POLICY', 'COMPLETED', { policy_version: '1.0' });
    await client.query('COMMIT');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

export async function submitEmployeeOnboarding(employeeId, actorUserId = null) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const onboardingCase = await ensureCase(client, employeeId);
    const incomplete = await client.query(
      `SELECT task_code, task_name
       FROM onboarding_tasks
       WHERE employee_id = $1 AND owner_type = 'EMPLOYEE' AND task_status <> 'COMPLETED'
       ORDER BY id`,
      [employeeId]
    );
    if (incomplete.rows.length) {
      const error = new Error(`Complete all employee onboarding tasks before submitting: ${incomplete.rows.map((row) => row.task_name).join(', ')}`);
      error.statusCode = 409;
      error.code = 'ONBOARDING_INCOMPLETE';
      error.details = incomplete.rows;
      throw error;
    }

    const employeeResult = await client.query(
      `UPDATE employees
       SET profile_status = 'SUBMITTED', updated_at = NOW()
       WHERE id = $1
       RETURNING employee_code, first_name, last_name, company_email`,
      [employeeId]
    );
    await client.query(
      `UPDATE onboarding_cases
       SET case_status = 'SUBMITTED', submitted_at = COALESCE(submitted_at, NOW()), updated_at = NOW()
       WHERE id = $1`,
      [onboardingCase.id]
    );

    const employee = employeeResult.rows[0];
    await createWorkflowNotification(client, {
      eventCode: 'EMPLOYEE_ONBOARDING_SUBMITTED',
      sourceModule: 'EMPLOYEE',
      entityType: 'ONBOARDING_CASE',
      entityId: onboardingCase.id,
      payload: {
        employee_id: employeeId,
        employee_code: employee?.employee_code || null,
        employee_name: [employee?.first_name, employee?.last_name].filter(Boolean).join(' '),
        company_email: employee?.company_email || null,
        onboarding_case_id: onboardingCase.id,
        submitted_by_user_id: actorUserId,
      },
      targets: [
        { channel: 'IN_APP', targetType: 'ROLE', targetValue: 'HR_EMPLOYEE_ADMIN' },
        { channel: 'EMAIL', targetType: 'ROLE', targetValue: 'HR_EMPLOYEE_ADMIN' },
      ],
    });

    await client.query('COMMIT');
    return { submitted: true, onboarding_case_id: onboardingCase.id };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally { client.release(); }
}

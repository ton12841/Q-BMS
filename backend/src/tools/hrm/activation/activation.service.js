import {
  activateEmployee,
  getActivationCase,
  listActivationCases,
  listActivationHistory,
  listActivationTasks,
} from './activation.repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeEmployeeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('A valid Employee ID is required.');
  return id;
}

function normalizeNote(value) {
  const note = String(value ?? '').trim();
  if (note.length > 4000) throw badRequest('Activation note must be 4,000 characters or fewer.');
  return note || null;
}

function buildChecks(detail, tasks) {
  const byCode = new Map(tasks.map((task) => [task.task_code, task]));
  const checks = [
    { code: 'IT_ACCOUNT_SETUP', label: 'IT Account Setup', passed: byCode.get('IT_ACCOUNT_SETUP')?.task_status === 'COMPLETED' },
    { code: 'IDENTITY_LINKED', label: 'Google Login / Identity Linking', passed: Boolean(detail.user_id && detail.google_subject && detail.invitation_status === 'ACCEPTED') },
    { code: 'SELF_ONBOARDING', label: 'Employee Self-Onboarding', passed: ['SUBMITTED', 'COMPLETE'].includes(String(detail.profile_status || '').toUpperCase()) && ['PERSONAL_INFORMATION','EMERGENCY_CONTACT','BANK_INFORMATION','PERSONAL_DOCUMENTS','COMPANY_POLICY'].every((code) => byCode.get(code)?.task_status === 'COMPLETED') },
    { code: 'HR_REVIEW', label: 'HR Review', passed: byCode.get('HR_REVIEW')?.task_status === 'COMPLETED' },
    { code: 'ASSET_GATE', label: 'Asset Gate', passed: byCode.get('ASSET_ASSIGNMENT')?.task_status === 'COMPLETED' && ['ASSET_COMPLETED', 'COMPLETED'].includes(detail.case_status) },
    { code: 'EMPLOYMENT_ASSIGNMENT', label: 'Primary Employment Assignment', passed: Boolean(detail.assignment_id) },
    { code: 'Q_BMS_USER', label: 'Q BMS User Account', passed: Boolean(detail.user_id) && !['SUSPENDED','INACTIVE'].includes(String(detail.user_account_status || '').toUpperCase()) },
  ];
  return checks;
}

export function listActivations({ locale }) {
  return listActivationCases({ locale });
}

export async function getActivationDetail({ employeeId, locale }) {
  const id = normalizeEmployeeId(employeeId);
  const detail = await getActivationCase(id, locale);
  if (!detail) {
    const error = new Error('Employee activation case was not found.');
    error.statusCode = 404;
    throw error;
  }
  const [tasks, history] = await Promise.all([
    listActivationTasks(id),
    listActivationHistory(id),
  ]);
  const checks = buildChecks(detail, tasks);
  const activationTask = tasks.find((task) => task.task_code === 'ACTIVATION');
  const isActive = detail.case_status === 'COMPLETED' && detail.employee_status === 'ACTIVE' && detail.profile_status === 'COMPLETE' && detail.user_account_status === 'ACTIVE';
  const canActivate = !isActive && detail.case_status === 'ASSET_COMPLETED' && checks.every((check) => check.passed) && activationTask?.task_status !== 'COMPLETED';
  return { activation: detail, tasks, checks, history, can_activate: canActivate, is_active: isActive };
}

export async function activate({ employeeId, payload, auth, locale }) {
  const id = normalizeEmployeeId(employeeId);
  await activateEmployee({
    employeeId: id,
    actorUserId: auth?.user?.id || null,
    note: normalizeNote(payload?.note),
  });
  return getActivationDetail({ employeeId: id, locale });
}

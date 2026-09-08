import { getEmployeeWorkspace } from './employee-workspace.repository.js';

function employeeIdFromAuth(auth) {
  const value = Number(auth?.user?.employeeId);
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error('This Q BMS user is not linked to an Employee record.');
    error.statusCode = 403;
    error.code = 'EMPLOYEE_IDENTITY_REQUIRED';
    throw error;
  }
  return value;
}

function assertWorkspaceReady(auth) {
  if (!auth?.identityVerified || !auth?.user) {
    const error = new Error('A verified Q BMS Employee identity is required.');
    error.statusCode = 401;
    error.code = 'EMPLOYEE_IDENTITY_REQUIRED';
    throw error;
  }

  if (!auth.canAccessWorkspace) {
    const error = new Error('Employee Workspace is available after onboarding activation is complete.');
    error.statusCode = 403;
    error.code = 'EMPLOYEE_WORKSPACE_NOT_ACTIVE';
    throw error;
  }
}

function displayName(employee) {
  return (
    employee.nickname ||
    [employee.first_name, employee.last_name].filter(Boolean).join(' ').trim() ||
    employee.company_email ||
    employee.employee_code ||
    'Employee'
  );
}

export async function loadMyEmployeeWorkspace({ auth, locale = 'en' }) {
  assertWorkspaceReady(auth);
  const employeeId = employeeIdFromAuth(auth);
  const data = await getEmployeeWorkspace(employeeId, locale);

  if (!data) {
    const error = new Error('Employee record was not found for this Q BMS account.');
    error.statusCode = 404;
    error.code = 'EMPLOYEE_NOT_FOUND';
    throw error;
  }

  return {
    employee: {
      ...data.employee,
      display_name: displayName(data.employee),
    },
    documents: data.documents,
    assets: data.assets,
    summary: {
      document_count: data.documents.length,
      asset_count: data.assets.length,
      onboarding_complete:
        String(data.employee.employee_status || '').toUpperCase() === 'ACTIVE' &&
        String(data.employee.profile_status || '').toUpperCase() === 'COMPLETE',
    },
  };
}

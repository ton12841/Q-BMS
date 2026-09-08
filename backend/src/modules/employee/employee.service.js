import {
  getEmployeeById,
  insertNewEmployee,
  listEmployees,
  updateEmployeeRecord,
  validateEmployeeAssignment,
} from './employee.repository.js';
import { resolveOnboardingState } from '../../core/onboarding-state/onboarding-state.service.js';

const EMPLOYMENT_TYPES = new Set(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function nullableText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function nullableDate(value) {
  const text = String(value || '').trim();
  return text || null;
}

function normalizeEmployeePayload(payload = {}) {
  const employeeCode = String(payload.employee_code || '').trim().toUpperCase();
  const firstName = String(payload.first_name || '').trim();
  const lastName = String(payload.last_name || '').trim();
  const nickname = nullableText(payload.nickname);
  const employmentType = String(payload.employment_type || 'FULL_TIME').trim().toUpperCase();
  const workLocation = nullableText(payload.work_location);
  const startDate = nullableDate(payload.start_date);
  const probationDays =
    payload.probation_days === '' || payload.probation_days === null || payload.probation_days === undefined
      ? null
      : Number(payload.probation_days);
  const probationEndDate = nullableDate(payload.probation_end_date);
  const contractEndDate = nullableDate(payload.contract_end_date);
  const hrNote = nullableText(payload.hr_note);
  const businessUnitId = Number(payload.business_unit_id);
  const positionId = Number(payload.position_id);
  const jobGradeId = Number(payload.job_grade_id);
  const effectiveFrom = nullableDate(payload.assignment_effective_from) || startDate;

  if (!employeeCode) throw validationError('Employee Code is required.');
  if (!firstName) throw validationError('First Name is required.');
  if (!lastName) throw validationError('Last Name is required.');
  if (!EMPLOYMENT_TYPES.has(employmentType)) throw validationError('Invalid Employment Type.');
  if (probationDays !== null && (!Number.isInteger(probationDays) || probationDays < 0)) {
    throw validationError('Probation Days must be zero or a positive integer.');
  }
  if (!Number.isInteger(businessUnitId) || businessUnitId <= 0) {
    throw validationError('Business Unit is required.');
  }
  if (!Number.isInteger(positionId) || positionId <= 0) {
    throw validationError('Position is required.');
  }
  if (!Number.isInteger(jobGradeId) || jobGradeId <= 0) {
    throw validationError('Job Grade is required.');
  }

  return {
    employee: {
      employeeCode,
      firstName,
      lastName,
      nickname,
      employmentType,
      workLocation,
      startDate,
      probationDays,
      probationEndDate,
      contractEndDate,
      hrNote,
    },
    assignment: {
      businessUnitId,
      positionId,
      jobGradeId,
      effectiveFrom,
    },
  };
}

async function assertAssignment({ businessUnitId, positionId, jobGradeId }) {
  const result = await validateEmployeeAssignment({
    businessUnitId,
    positionId,
    jobGradeId,
  });
  if (!result.business_unit_exists) {
    throw validationError('Selected Business Unit is not available.');
  }
  if (!result.position_exists) {
    throw validationError('Selected Position is not available.');
  }
  if (!result.job_grade_exists) {
    throw validationError('Selected Job Grade is not available.');
  }
  if (!result.position_grade_allowed) {
    throw validationError('Selected Job Grade is not allowed for this Position.');
  }
}

function withCanonicalOnboardingState(row) {
  if (!row) return row;
  return {
    ...row,
    onboarding_state: resolveOnboardingState(row),
  };
}

export async function getEmployees({ locale = 'en' } = {}) {
  const rows = await listEmployees({ locale });
  return rows.map(withCanonicalOnboardingState);
}

export async function getEmployee({ id, locale = 'en' }) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw validationError('Invalid Employee ID.');
  }
  const row = await getEmployeeById({ id: Number(id), locale });
  return withCanonicalOnboardingState(row);
}

export async function createEmployee(payload) {
  const normalized = normalizeEmployeePayload(payload);
  await assertAssignment(normalized.assignment);

  // New Employee is the permanent HR entry flow.
  // Workflow-owned fields are intentionally NOT accepted from the client:
  // company_email = NULL until IT completes Workspace setup
  // employee_status = PRE_ONBOARDING
  // employee_record_type = NEW_HIRE
  // profile_status = NOT_STARTED
  // A PENDING IT account setup request is created in the same transaction.
  return insertNewEmployee(normalized);
}

export async function updateEmployee({ id, payload }) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw validationError('Invalid Employee ID.');
  }

  const employeeId = Number(id);
  const normalized = normalizeEmployeePayload(payload);
  await assertAssignment(normalized.assignment);

  const existing = await getEmployeeById({ id: employeeId, locale: 'en' });
  if (!existing) return null;

  const organizationChanged =
    Number(existing.business_unit_id) !== Number(normalized.assignment.businessUnitId) ||
    Number(existing.position_id) !== Number(normalized.assignment.positionId) ||
    Number(existing.job_grade_id) !== Number(normalized.assignment.jobGradeId);

  if (existing.employee_status === 'ACTIVE' && organizationChanged) {
    const error = validationError(
      'Active Employee organization changes must be made through Organization Assignment Management so assignment history is preserved.'
    );
    error.statusCode = 409;
    error.code = 'EMPLOYEE_ASSIGNMENT_HISTORY_REQUIRED';
    throw error;
  }

  // For ACTIVE Employees, Employee Master edits never mutate the canonical
  // Employee Assignment row. Organization changes are versioned separately.
  // Pre-onboarding Employees may still correct their initial assignment before
  // activation because the assignment has not become employment history yet.
  return updateEmployeeRecord({
    id: employeeId,
    ...normalized,
    updateAssignment: existing.employee_status !== 'ACTIVE',
  });
}

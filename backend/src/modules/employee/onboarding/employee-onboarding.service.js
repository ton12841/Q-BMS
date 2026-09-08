import {
  acknowledgePolicy,
  addEmployeeDocument,
  getEmployeeOnboarding,
  saveBankInformation,
  saveEmergencyContact,
  savePersonalInformation,
  submitEmployeeOnboarding,
} from './employee-onboarding.repository.js';
import { resolveOnboardingState } from '../../../core/onboarding-state/onboarding-state.service.js';

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function text(value, { required = false, max = 500 } = {}) {
  const normalized = String(value ?? '').trim();
  if (required && !normalized) throw badRequest('Required onboarding information is missing.');
  if (normalized.length > max) throw badRequest('Onboarding information is too long.');
  return normalized || null;
}

function employeeIdFromAuth(auth) {
  const value = Number(auth?.user?.employeeId);
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error('This Q BMS user is not linked to an Employee record.');
    error.statusCode = 403;
    throw error;
  }
  return value;
}

function assertEditable(auth) {
  const profileStatus = String(auth?.user?.profileStatus || '').toUpperCase();
  if (['SUBMITTED', 'COMPLETE'].includes(profileStatus)) {
    const error = new Error('This onboarding profile has already been submitted and is read-only.');
    error.statusCode = 409;
    throw error;
  }
}

export async function getEmployeeOnboardingSnapshot(employeeId, locale = 'en') {
  const data = await getEmployeeOnboarding(employeeId, locale);
  return {
    ...data,
    onboarding_state: resolveOnboardingState({
      ...data.employee,
      caseStatus: data.onboarding_case?.case_status,
    }),
  };
}

export function loadMyOnboarding({ auth, locale }) {
  return getEmployeeOnboardingSnapshot(employeeIdFromAuth(auth), locale);
}

export async function updateMyPersonal({ auth, payload }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  await savePersonalInformation(employeeId, {
    firstName: text(payload.first_name, { required: true, max: 160 }),
    lastName: text(payload.last_name, { required: true, max: 160 }),
    nickname: text(payload.nickname, { max: 160 }),
    dateOfBirth: text(payload.date_of_birth, { max: 20 }),
    gender: text(payload.gender, { max: 80 }),
    nationality: text(payload.nationality, { max: 120 }),
    nationalId: text(payload.national_id, { max: 160 }),
    mobile: text(payload.mobile, { required: true, max: 80 }),
    personalEmail: text(payload.personal_email, { max: 255 }),
    currentAddress: text(payload.current_address, { max: 4000 }),
    permanentAddress: text(payload.permanent_address, { max: 4000 }),
  });
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

export async function updateMyEmergency({ auth, payload }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  await saveEmergencyContact(employeeId, {
    contactName: text(payload.contact_name, { required: true, max: 255 }),
    relationship: text(payload.relationship, { required: true, max: 160 }),
    phone: text(payload.phone, { required: true, max: 80 }),
    alternatePhone: text(payload.alternate_phone, { max: 80 }),
  });
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

export async function updateMyBank({ auth, payload }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  await saveBankInformation(employeeId, {
    bankName: text(payload.bank_name, { required: true, max: 255 }),
    accountName: text(payload.account_name, { required: true, max: 255 }),
    accountNumber: text(payload.account_number, { required: true, max: 255 }),
    currency: text(payload.currency || 'LAK', { required: true, max: 16 }),
    bankBranch: text(payload.bank_branch, { max: 255 }),
  });
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

export async function addMyDocument({ auth, payload }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  const documentUrl = text(payload.document_url, { required: true, max: 4000 });
  try {
    const parsed = new URL(documentUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw badRequest('Document link must be a valid http/https URL.');
  }
  await addEmployeeDocument(employeeId, {
    documentType: text(payload.document_type, { required: true, max: 160 }),
    documentUrl,
  });
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

export async function acceptMyPolicy({ auth }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  await acknowledgePolicy(employeeId);
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

export async function submitMyOnboarding({ auth }) {
  assertEditable(auth);
  const employeeId = employeeIdFromAuth(auth);
  await submitEmployeeOnboarding(employeeId, auth?.user?.id || null);
  return getEmployeeOnboardingSnapshot(employeeId, 'en');
}

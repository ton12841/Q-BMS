import {
  completeAccountSetupRequest,
  getAccountSetupRequest,
  listAccountSetupRequests,
  startAccountSetupRequest,
} from './account-setup.repository.js';

function workflowError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeCompanyEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function allowedCompanyDomain() {
  return String(process.env.COMPANY_EMAIL_DOMAIN || 'iquritech.com')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
}

function assertCompanyEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw workflowError('A valid Company Email is required.');
  }

  const domain = allowedCompanyDomain();
  if (domain && !email.endsWith(`@${domain}`)) {
    throw workflowError(`Company Email must use @${domain}.`);
  }
}

export async function getAccountSetupQueue({ locale = 'en' } = {}) {
  return listAccountSetupRequests({ locale });
}

export async function startAccountSetup({ id, locale = 'en' }) {
  const requestId = validId(id);
  if (!requestId) throw workflowError('Invalid account setup request ID.');

  const current = await getAccountSetupRequest({ id: requestId, locale });
  if (!current) throw workflowError('Account setup request not found.', 404);
  if (current.request_status === 'COMPLETED') {
    throw workflowError('Account setup request is already completed.', 409);
  }
  if (current.request_status === 'CANCELLED') {
    throw workflowError('Cancelled account setup request cannot be started.', 400);
  }

  await startAccountSetupRequest({ id: requestId });
  return getAccountSetupRequest({ id: requestId, locale });
}

export async function completeAccountSetup({ id, locale = 'en', payload = {} }) {
  const requestId = validId(id);
  if (!requestId) throw workflowError('Invalid account setup request ID.');

  const companyEmail = normalizeCompanyEmail(payload.company_email);
  assertCompanyEmail(companyEmail);

  const itNote = String(payload.it_note || '').trim() || null;

  const current = await getAccountSetupRequest({ id: requestId, locale });
  if (!current) throw workflowError('Account setup request not found.', 404);

  await completeAccountSetupRequest({
    id: requestId,
    companyEmail,
    itNote,
  });

  return getAccountSetupRequest({ id: requestId, locale });
}

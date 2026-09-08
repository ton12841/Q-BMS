import {
  getInvitationCandidate,
  listInvitationCandidates,
  queueEmployeeInvitation,
  revokeEmployeeInvitation,
} from './invitation.repository.js';

function workflowError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getInvitationQueue({ locale = 'en' } = {}) {
  return listInvitationCandidates({ locale });
}

export async function queueInvitation({ employeeId, locale = 'en' }) {
  const id = validId(employeeId);
  if (!id) throw workflowError('Invalid employee ID.');

  const current = await getInvitationCandidate({ employeeId: id, locale });
  if (!current) {
    throw workflowError('Employee is not ready for invitation.', 404);
  }

  if (!current.company_email || current.account_setup_status !== 'COMPLETED') {
    throw workflowError('IT must complete Company Email setup before HR can send an invitation.', 409);
  }

  await queueEmployeeInvitation({ employeeId: id, expiresInDays: 7 });
  return getInvitationCandidate({ employeeId: id, locale });
}

export async function revokeInvitation({ employeeId, locale = 'en' }) {
  const id = validId(employeeId);
  if (!id) throw workflowError('Invalid employee ID.');

  const current = await getInvitationCandidate({ employeeId: id, locale });
  if (!current) throw workflowError('Employee invitation was not found.', 404);

  if (!['DRAFT', 'QUEUED', 'SENT'].includes(current.invitation_status || '')) {
    throw workflowError('There is no active invitation to revoke.', 409);
  }

  const revoked = await revokeEmployeeInvitation({ employeeId: id });
  if (!revoked) throw workflowError('There is no active invitation to revoke.', 409);

  return getInvitationCandidate({ employeeId: id, locale });
}

import {
  getInvitationQueue,
  queueInvitation,
  revokeInvitation,
} from './invitation.service.js';

function requestLocale(req) {
  const locale = String(req.query.lang || 'en').toLowerCase();
  return ['en', 'th', 'lo'].includes(locale) ? locale : 'en';
}

function handleWorkflowError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  return next(error);
}

export async function invitationQueueController(req, res, next) {
  try {
    const data = await getInvitationQueue({ locale: requestLocale(req) });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function queueInvitationController(req, res, next) {
  try {
    const data = await queueInvitation({
      employeeId: req.params.employeeId,
      locale: requestLocale(req),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleWorkflowError(error, res, next);
  }
}

export async function revokeInvitationController(req, res, next) {
  try {
    const data = await revokeInvitation({
      employeeId: req.params.employeeId,
      locale: requestLocale(req),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleWorkflowError(error, res, next);
  }
}

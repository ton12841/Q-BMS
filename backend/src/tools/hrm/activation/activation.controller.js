import { activate, getActivationDetail, listActivations } from './activation.service.js';

function localeOf(req) {
  const locale = String(req.query.lang || 'en').toLowerCase();
  return ['en', 'th', 'lo'].includes(locale) ? locale : 'en';
}

function replyError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code || null,
      details: error.details || null,
    });
  }
  return next(error);
}

export async function listActivationsController(req, res, next) {
  try { return res.json({ success: true, data: await listActivations({ locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}

export async function getActivationController(req, res, next) {
  try { return res.json({ success: true, data: await getActivationDetail({ employeeId: req.params.employeeId, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}

export async function activateEmployeeController(req, res, next) {
  try { return res.json({ success: true, data: await activate({ employeeId: req.params.employeeId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}

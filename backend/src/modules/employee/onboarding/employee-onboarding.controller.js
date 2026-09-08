import {
  acceptMyPolicy,
  addMyDocument,
  loadMyOnboarding,
  submitMyOnboarding,
  updateMyBank,
  updateMyEmergency,
  updateMyPersonal,
} from './employee-onboarding.service.js';

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

export async function getMyOnboardingController(req, res, next) {
  try {
    const data = await loadMyOnboarding({ auth: req.auth, locale: localeOf(req) });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function savePersonalController(req, res, next) {
  try {
    const data = await updateMyPersonal({ auth: req.auth, payload: req.body || {} });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function saveEmergencyController(req, res, next) {
  try {
    const data = await updateMyEmergency({ auth: req.auth, payload: req.body || {} });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function saveBankController(req, res, next) {
  try {
    const data = await updateMyBank({ auth: req.auth, payload: req.body || {} });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function addDocumentController(req, res, next) {
  try {
    const data = await addMyDocument({ auth: req.auth, payload: req.body || {} });
    return res.status(201).json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function acknowledgePolicyController(req, res, next) {
  try {
    const data = await acceptMyPolicy({ auth: req.auth });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function submitOnboardingController(req, res, next) {
  try {
    const data = await submitMyOnboarding({ auth: req.auth });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

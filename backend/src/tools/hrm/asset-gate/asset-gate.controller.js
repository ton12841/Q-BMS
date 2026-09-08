import {
  assignExisting,
  completeWithAssets,
  getGateDetail,
  listGates,
  noAssetRequired,
  registerAndAssign,
  removeAssignment,
} from './asset-gate.service.js';

function localeOf(req) {
  const locale = String(req.query.lang || 'en').toLowerCase();
  return ['en', 'th', 'lo'].includes(locale) ? locale : 'en';
}
function replyError(error, res, next) {
  if (error?.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code || null, details: error.details || null });
  return next(error);
}

export async function listGatesController(req, res, next) {
  try { return res.json({ success: true, data: await listGates({ locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function getGateController(req, res, next) {
  try { return res.json({ success: true, data: await getGateDetail({ employeeId: req.params.employeeId, locale: localeOf(req), search: req.query.search || '' }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function registerAndAssignController(req, res, next) {
  try { return res.json({ success: true, data: await registerAndAssign({ employeeId: req.params.employeeId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function assignExistingController(req, res, next) {
  try { return res.json({ success: true, data: await assignExisting({ employeeId: req.params.employeeId, assetId: req.params.assetId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function removeAssignmentController(req, res, next) {
  try { return res.json({ success: true, data: await removeAssignment({ employeeId: req.params.employeeId, assignmentId: req.params.assignmentId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function completeWithAssetsController(req, res, next) {
  try { return res.json({ success: true, data: await completeWithAssets({ employeeId: req.params.employeeId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}
export async function noAssetRequiredController(req, res, next) {
  try { return res.json({ success: true, data: await noAssetRequired({ employeeId: req.params.employeeId, payload: req.body || {}, auth: req.auth, locale: localeOf(req) }) }); }
  catch (error) { return replyError(error, res, next); }
}

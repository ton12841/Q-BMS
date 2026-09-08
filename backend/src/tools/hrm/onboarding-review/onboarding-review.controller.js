import { approveReview, getReviewDetail, listReviews, requestChanges } from './onboarding-review.service.js';

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

export async function listReviewsController(req, res, next) {
  try {
    const data = await listReviews({ locale: localeOf(req) });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function getReviewController(req, res, next) {
  try {
    const data = await getReviewDetail({ employeeId: req.params.employeeId, locale: localeOf(req) });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function requestChangesController(req, res, next) {
  try {
    const data = await requestChanges({
      employeeId: req.params.employeeId,
      payload: req.body || {},
      auth: req.auth,
      locale: localeOf(req),
    });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

export async function approveReviewController(req, res, next) {
  try {
    const data = await approveReview({
      employeeId: req.params.employeeId,
      payload: req.body || {},
      auth: req.auth,
      locale: localeOf(req),
    });
    return res.json({ success: true, data });
  } catch (error) { return replyError(error, res, next); }
}

import { normalizeLocale } from '../../../core/i18n/i18n.js';
import {
  createOrChangeReportingLine,
  endReportingLine,
  getReportingLinesOverview,
} from './reporting-lines.service.js';

function localeOf(req) {
  return normalizeLocale(
    req.query.lang ||
    req.headers['x-qbms-locale'] ||
    req.headers['accept-language']
  );
}

function handleDomainError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code || 'REPORTING_LINE_ERROR',
      message: error.message,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      code: 'REPORTING_LINE_CONFLICT',
      message: 'A conflicting active Reporting Line already exists.',
    });
  }

  if (error?.code === '23503') {
    return res.status(400).json({
      success: false,
      code: 'REPORTING_LINE_REFERENCE_INVALID',
      message: 'Reporting Line references an unavailable Employee Assignment.',
    });
  }

  return next(error);
}

export async function reportingLinesOverviewController(req, res, next) {
  try {
    const data = await getReportingLinesOverview({ locale: localeOf(req) });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createReportingLineController(req, res, next) {
  try {
    const data = await createOrChangeReportingLine({
      payload: req.body || {},
      actorUserId: req.auth?.user?.id || null,
      locale: localeOf(req),
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
}

export async function endReportingLineController(req, res, next) {
  try {
    const data = await endReportingLine({
      id: req.params.id,
      payload: req.body || {},
      actorUserId: req.auth?.user?.id || null,
      locale: localeOf(req),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
}

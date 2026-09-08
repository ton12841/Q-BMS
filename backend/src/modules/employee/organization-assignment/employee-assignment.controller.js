import { normalizeLocale } from '../../../core/i18n/i18n.js';
import {
  getEmployeeAssignmentOverview,
  transitionEmployeeAssignment,
} from './employee-assignment.service.js';

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
      code: error.code || 'EMPLOYEE_ASSIGNMENT_ERROR',
      message: error.message,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      code: 'EMPLOYEE_ASSIGNMENT_CONFLICT',
      message: 'A conflicting Employee Assignment already exists.',
    });
  }

  if (error?.code === '23503') {
    return res.status(400).json({
      success: false,
      code: 'EMPLOYEE_ASSIGNMENT_REFERENCE_INVALID',
      message: 'Employee Assignment references unavailable Organization data.',
    });
  }

  return next(error);
}

export async function employeeAssignmentOverviewController(req, res, next) {
  try {
    const data = await getEmployeeAssignmentOverview({
      employeeId: req.params.employeeId,
      locale: localeOf(req),
    });

    return res.json({ success: true, data });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
}

export async function transitionEmployeeAssignmentController(req, res, next) {
  try {
    const data = await transitionEmployeeAssignment({
      employeeId: req.params.employeeId,
      payload: req.body || {},
      actorUserId: req.auth?.user?.id || null,
      locale: localeOf(req),
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleDomainError(error, res, next);
  }
}

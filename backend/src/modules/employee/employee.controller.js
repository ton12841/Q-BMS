
import { normalizeLocale } from '../../core/i18n/i18n.js';
import {
  createEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
} from './employee.service.js';

function requestLocale(req) {
  return normalizeLocale(
    req.query.lang ||
    req.headers['x-qbms-locale'] ||
    req.headers['accept-language']
  );
}

function handleWriteError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }

  if (error?.code === '23505') {
    const detail = String(error.detail || '');
    let message = 'Employee Code or Company Email already exists.';
    if (detail.includes('employee_code')) message = 'Employee Code already exists.';
    else if (detail.includes('company_email')) message = 'Company Email already exists.';
    return res.status(409).json({ success: false, message });
  }

  if (error?.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Employee references an unavailable organization master record.',
    });
  }

  return next(error);
}

export async function employeesController(req, res, next) {
  try {
    const data = await getEmployees({ locale: requestLocale(req) });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function employeeDetailController(req, res, next) {
  try {
    const data = await getEmployee({
      id: Number(req.params.id),
      locale: requestLocale(req),
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return handleWriteError(error, res, next);
  }
}

export async function createEmployeeController(req, res, next) {
  try {
    const data = await createEmployee(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleWriteError(error, res, next);
  }
}

export async function updateEmployeeController(req, res, next) {
  try {
    const data = await updateEmployee({
      id: Number(req.params.id),
      payload: req.body,
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return handleWriteError(error, res, next);
  }
}

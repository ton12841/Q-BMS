import { normalizeLocale } from '../../../core/i18n/i18n.js';
import {
  completeAccountSetup,
  getAccountSetupQueue,
  startAccountSetup,
} from './account-setup.service.js';

function requestLocale(req) {
  return normalizeLocale(
    req.query.lang ||
    req.headers['x-qbms-locale'] ||
    req.headers['accept-language']
  );
}

function handleWorkflowError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.code === '23505') {
    const detail = String(error.detail || '');
    if (detail.includes('company_email') || detail.includes('email')) {
      return res.status(409).json({
        success: false,
        message: 'Company Email already belongs to another employee or Q BMS user.',
      });
    }
  }

  return next(error);
}

export async function accountSetupQueueController(req, res, next) {
  try {
    const data = await getAccountSetupQueue({ locale: requestLocale(req) });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function startAccountSetupController(req, res, next) {
  try {
    const data = await startAccountSetup({
      id: req.params.id,
      locale: requestLocale(req),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleWorkflowError(error, res, next);
  }
}

export async function completeAccountSetupController(req, res, next) {
  try {
    const data = await completeAccountSetup({
      id: req.params.id,
      locale: requestLocale(req),
      payload: req.body,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleWorkflowError(error, res, next);
  }
}

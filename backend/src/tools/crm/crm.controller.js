import {
  createCRMLead,
  getCRMContextBusinessUnits,
  getCRMLead,
  getCRMLeads,
} from './crm.service.js';

function handleCRMError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code || undefined,
      details: error.details || undefined,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'CRM Lead conflicts with an existing record.',
      code: 'CRM_LEAD_CONFLICT',
    });
  }

  if (error?.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'CRM Lead references an unavailable Q BMS master record.',
      code: 'CRM_REFERENCE_INVALID',
    });
  }

  return next(error);
}

export async function crmBusinessUnitsController(req, res, next) {
  try {
    const data = await getCRMContextBusinessUnits(req.auth);
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmLeadsController(req, res, next) {
  try {
    const data = await getCRMLeads({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      query: String(req.query.query || ''),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmLeadDetailController(req, res, next) {
  try {
    const data = await getCRMLead({
      auth: req.auth,
      leadCode: req.params.leadCode,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'CRM Lead not found.',
        code: 'CRM_LEAD_NOT_FOUND',
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function createCRMLeadController(req, res, next) {
  try {
    const data = await createCRMLead({
      auth: req.auth,
      input: req.body || {},
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

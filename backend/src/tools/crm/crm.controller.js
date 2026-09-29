import {
  assignCRMLeadOwner,
  changeCRMDealStage,
  completeCRMActivity,
  convertCRMLeadToDeal,
  createCRMActivity,
  createCRMCustomerDeal,
  createCRMLead,
  getCRMActivities,
  getCRMContextBusinessUnits,
  getCRMProductOptions,
  getCRMCustomers,
  getCRMDeal,
  getCRMDeals,
  getCRMLead,
  getCRMLeads,
  getCRMPerformance,
  getCRMCommissions,
  getCRMAccessProfile,
  getCRMBUSettings,
  saveCRMBUGeneral,
  saveCRMBUMember,
  saveCRMSalesTeam,
  saveCRMPipelineSettings,
  saveCRMPointRules,
  saveCRMProductMaster,
  saveCRMCustomerMaster,
  saveCRMSalesPointTarget,
  saveCRMCommissionPlan,
  rescheduleCRMActivity,
  updateCRMDeal,
  saveCRMDealProductLines,
  processCRMIntegrationEvent,
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
      message: 'CRM record conflicts with an existing record.',
      code: 'CRM_RECORD_CONFLICT',
    });
  }

  if (error?.code === '23503' || error?.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'CRM record references invalid or unavailable data.',
      code: 'CRM_REFERENCE_INVALID',
    });
  }

  return next(error);
}

export async function crmBusinessUnitsController(req, res, next) {
  try {
    return res.json({ success: true, data: await getCRMContextBusinessUnits(req.auth) });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}


export async function crmProductOptionsController(req, res, next) {
  try {
    const data = await getCRMProductOptions({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || '').toUpperCase(),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function saveCRMProductMasterController(req, res, next) {
  try {
    const data = await saveCRMProductMaster({
      auth: req.auth,
      businessUnitCode: String(req.params.businessUnitCode || '').toUpperCase(),
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}


export async function crmCustomersController(req, res, next) {
  try {
    const data = await getCRMCustomers({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      scope: String(req.query.scope || 'AUTO').toUpperCase(),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function saveCRMCustomerMasterController(req, res, next) {
  try {
    const data = await saveCRMCustomerMaster({
      auth: req.auth,
      businessUnitCode: String(req.params.businessUnitCode || '').toUpperCase(),
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function createCRMCustomerDealController(req, res, next) {
  try {
    const data = await createCRMCustomerDeal({
      auth: req.auth,
      businessUnitCode: String(req.params.businessUnitCode || '').toUpperCase(),
      customerCode: String(req.params.customerCode || '').toUpperCase(),
      input: req.body || {},
    });
    return res.status(201).json({ success: true, data });
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
      scope: String(req.query.scope || 'AUTO').toUpperCase(),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmLeadDetailController(req, res, next) {
  try {
    const data = await getCRMLead({ auth: req.auth, leadCode: req.params.leadCode });
    if (!data) {
      return res.status(404).json({ success: false, message: 'CRM Lead not found.', code: 'CRM_LEAD_NOT_FOUND' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function createCRMLeadController(req, res, next) {
  try {
    const data = await createCRMLead({ auth: req.auth, input: req.body || {} });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}


export async function assignCRMLeadOwnerController(req, res, next) {
  try {
    const data = await assignCRMLeadOwner({
      auth: req.auth,
      leadCode: req.params.leadCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmDealsController(req, res, next) {
  try {
    const data = await getCRMDeals({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      query: String(req.query.query || ''),
      scope: String(req.query.scope || 'AUTO').toUpperCase(),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmDealDetailController(req, res, next) {
  try {
    const data = await getCRMDeal({ auth: req.auth, dealCode: req.params.dealCode });
    if (!data) {
      return res.status(404).json({ success: false, message: 'CRM Deal not found.', code: 'CRM_DEAL_NOT_FOUND' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function convertCRMLeadToDealController(req, res, next) {
  try {
    const data = await convertCRMLeadToDeal({
      auth: req.auth,
      leadCode: req.params.leadCode,
      input: req.body || {},
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function changeCRMDealStageController(req, res, next) {
  try {
    const data = await changeCRMDealStage({
      auth: req.auth,
      dealCode: req.params.dealCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function updateCRMDealController(req, res, next) {
  try {
    const data = await updateCRMDeal({
      auth: req.auth,
      dealCode: req.params.dealCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}


export async function saveCRMDealProductLinesController(req, res, next) {
  try {
    const data = await saveCRMDealProductLines({
      auth: req.auth,
      dealCode: req.params.dealCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmIntegrationEventController(req, res, next) {
  try {
    const data = await processCRMIntegrationEvent({
      auth: req.auth,
      input: req.body || {},
    });
    return res.status(data?.integrationDuplicate ? 200 : 201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmPerformanceController(req, res, next) {
  try {
    const data = await getCRMPerformance({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      period: String(req.query.period || ''),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmCommissionsController(req, res, next) {
  try {
    const data = await getCRMCommissions({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      period: String(req.query.period || ''),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmActivitiesController(req, res, next) {
  try {
    const data = await getCRMActivities({
      auth: req.auth,
      businessUnitCode: String(req.query.business_unit || 'ALL').toUpperCase(),
      leadCode: req.query.lead_code ? String(req.query.lead_code) : null,
      dealCode: req.query.deal_code ? String(req.query.deal_code) : null,
      scope: String(req.query.scope || 'AUTO').toUpperCase(),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function createCRMLeadActivityController(req, res, next) {
  try {
    const data = await createCRMActivity({
      auth: req.auth,
      leadCode: req.params.leadCode,
      dealCode: null,
      input: req.body || {},
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function createCRMDealActivityController(req, res, next) {
  try {
    const data = await createCRMActivity({
      auth: req.auth,
      leadCode: null,
      dealCode: req.params.dealCode,
      input: req.body || {},
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function completeCRMActivityController(req, res, next) {
  try {
    const data = await completeCRMActivity({
      auth: req.auth,
      activityCode: req.params.activityCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function rescheduleCRMActivityController(req, res, next) {
  try {
    const data = await rescheduleCRMActivity({
      auth: req.auth,
      activityCode: req.params.activityCode,
      input: req.body || {},
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}


export async function crmAccessProfileController(req, res, next) {
  try {
    return res.json({ success: true, data: await getCRMAccessProfile(req.auth) });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

export async function crmBUSettingsController(req, res, next) {
  try {
    const data = await getCRMBUSettings({
      auth: req.auth,
      businessUnitCode: String(req.params.businessUnitCode || '').toUpperCase(),
      period: String(req.query.period || ''),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return handleCRMError(error, res, next);
  }
}

function settingAction(service) {
  return async (req, res, next) => {
    try {
      const data = await service({
        auth: req.auth,
        businessUnitCode: String(req.params.businessUnitCode || '').toUpperCase(),
        input: req.body || {},
      });
      return res.json({ success: true, data });
    } catch (error) {
      return handleCRMError(error, res, next);
    }
  };
}

export const saveCRMBUGeneralController = settingAction(saveCRMBUGeneral);
export const saveCRMBUMemberController = settingAction(saveCRMBUMember);
export const saveCRMSalesTeamController = settingAction(saveCRMSalesTeam);
export const saveCRMPipelineSettingsController = settingAction(saveCRMPipelineSettings);
export const saveCRMPointRulesController = settingAction(saveCRMPointRules);
export const saveCRMSalesPointTargetController = settingAction(saveCRMSalesPointTarget);
export const saveCRMCommissionPlanController = settingAction(saveCRMCommissionPlan);

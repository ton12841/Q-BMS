import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import {
  assignCRMLeadOwnerController,
  changeCRMDealStageController,
  completeCRMActivityController,
  convertCRMLeadToDealController,
  createCRMDealActivityController,
  createCRMCustomerDealController,
  createCRMLeadActivityController,
  createCRMLeadController,
  crmActivitiesController,
  crmBusinessUnitsController,
  crmProductOptionsController,
  crmCustomersController,
  crmDealDetailController,
  crmDealsController,
  crmPerformanceController,
  crmCommissionsController,
  crmLeadDetailController,
  crmLeadsController,
  rescheduleCRMActivityController,
  updateCRMDealController,
  saveCRMDealProductLinesController,
  crmIntegrationEventController,
  crmAccessProfileController,
  crmBUSettingsController,
  saveCRMBUGeneralController,
  saveCRMBUMemberController,
  saveCRMSalesTeamController,
  saveCRMPipelineSettingsController,
  saveCRMPointRulesController,
  saveCRMProductMasterController,
  saveCRMCustomerMasterController,
  saveCRMSalesPointTargetController,
  saveCRMCommissionPlanController,
} from './crm.controller.js';

export const crmRouter = Router();

const requireLeadView = requirePermission('crm.lead.view');
const requireLeadManage = requirePermission('crm.lead.manage');
const requireDealView = requirePermission('crm.deal.view');
const requireDealManage = requirePermission('crm.deal.manage');
const requireActivityView = requirePermission('crm.activity.view');
const requireActivityManage = requirePermission('crm.activity.manage');

crmRouter.get('/context/business-units', requireLeadView, crmBusinessUnitsController);
crmRouter.get('/context/products', requireDealView, crmProductOptionsController);
crmRouter.get('/access', requireLeadView, crmAccessProfileController);
crmRouter.get('/settings/:businessUnitCode', requireLeadView, crmBUSettingsController);
crmRouter.put('/settings/:businessUnitCode/general', requireLeadView, saveCRMBUGeneralController);
crmRouter.put('/settings/:businessUnitCode/member', requireLeadView, saveCRMBUMemberController);
crmRouter.put('/settings/:businessUnitCode/team', requireLeadView, saveCRMSalesTeamController);
crmRouter.put('/settings/:businessUnitCode/pipeline', requireLeadView, saveCRMPipelineSettingsController);
crmRouter.put('/settings/:businessUnitCode/product-master', requireLeadView, saveCRMProductMasterController);
crmRouter.put('/settings/:businessUnitCode/points', requireLeadView, saveCRMPointRulesController);
crmRouter.put('/settings/:businessUnitCode/target', requireLeadView, saveCRMSalesPointTargetController);
crmRouter.put('/settings/:businessUnitCode/commission', requireLeadView, saveCRMCommissionPlanController);

crmRouter.get('/customers', requireDealView, crmCustomersController);
crmRouter.put('/customers/:businessUnitCode', requireDealView, saveCRMCustomerMasterController);
crmRouter.post('/customers/:businessUnitCode/:customerCode/deals', requireDealManage, createCRMCustomerDealController);

crmRouter.get('/leads', requireLeadView, crmLeadsController);
crmRouter.get('/leads/:leadCode', requireLeadView, crmLeadDetailController);
crmRouter.post('/leads', requireLeadView, createCRMLeadController);
crmRouter.post('/leads/:leadCode/convert-deal', requireDealManage, convertCRMLeadToDealController);
crmRouter.patch('/leads/:leadCode/owner', requireLeadView, assignCRMLeadOwnerController);

crmRouter.get('/deals', requireDealView, crmDealsController);
crmRouter.get('/deals/:dealCode', requireDealView, crmDealDetailController);
crmRouter.patch('/deals/:dealCode', requireDealManage, updateCRMDealController);
crmRouter.patch('/deals/:dealCode/stage', requireDealManage, changeCRMDealStageController);
crmRouter.put('/deals/:dealCode/products', requireDealManage, saveCRMDealProductLinesController);

crmRouter.post('/integrations/events', requirePermission('crm.integration.trusted'), crmIntegrationEventController);

crmRouter.get('/performance', requireDealView, crmPerformanceController);
crmRouter.get('/commissions', requireDealView, crmCommissionsController);

crmRouter.get('/activities', requireActivityView, crmActivitiesController);
crmRouter.post('/leads/:leadCode/activities', requireActivityManage, createCRMLeadActivityController);
crmRouter.post('/deals/:dealCode/activities', requireActivityManage, createCRMDealActivityController);
crmRouter.patch('/activities/:activityCode/complete', requireActivityManage, completeCRMActivityController);
crmRouter.patch('/activities/:activityCode/reschedule', requireActivityManage, rescheduleCRMActivityController);

import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import {
  createCRMLeadController,
  crmBusinessUnitsController,
  crmLeadDetailController,
  crmLeadsController,
} from './crm.controller.js';

export const crmRouter = Router();

const requireLeadView = requirePermission('crm.lead.view');
const requireLeadManage = requirePermission('crm.lead.manage');

crmRouter.get('/context/business-units', requireLeadView, crmBusinessUnitsController);
crmRouter.get('/leads', requireLeadView, crmLeadsController);
crmRouter.get('/leads/:leadCode', requireLeadView, crmLeadDetailController);
crmRouter.post('/leads', requireLeadManage, createCRMLeadController);

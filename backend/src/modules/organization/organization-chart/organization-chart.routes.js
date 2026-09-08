import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth.middleware.js';
import { organizationChartController } from './organization-chart.controller.js';

export const organizationChartRouter = Router();

organizationChartRouter.get(
  '/',
  requirePermission('organization.chart.view'),
  organizationChartController
);

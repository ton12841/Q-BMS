import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth.middleware.js';
import {
  createReportingLineController,
  endReportingLineController,
  reportingLinesOverviewController,
} from './reporting-lines.controller.js';

export const reportingLinesRouter = Router();

reportingLinesRouter.get(
  '/overview',
  requirePermission('organization.reporting_lines.view'),
  reportingLinesOverviewController
);

reportingLinesRouter.post(
  '/',
  requirePermission('organization.reporting_lines.manage'),
  createReportingLineController
);

reportingLinesRouter.post(
  '/:id/end',
  requirePermission('organization.reporting_lines.manage'),
  endReportingLineController
);

import { Router } from 'express';
import { requirePermission } from '../../../middleware/auth.middleware.js';
import {
  employeeAssignmentOverviewController,
  transitionEmployeeAssignmentController,
} from './employee-assignment.controller.js';

export const employeeAssignmentRouter = Router({ mergeParams: true });

employeeAssignmentRouter.get(
  '/overview',
  requirePermission('employee.organization_assignment.view'),
  employeeAssignmentOverviewController
);

employeeAssignmentRouter.post(
  '/transitions',
  requirePermission('employee.organization_assignment.manage'),
  transitionEmployeeAssignmentController
);

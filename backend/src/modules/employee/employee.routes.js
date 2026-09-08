import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import { employeeAssignmentRouter } from './organization-assignment/employee-assignment.routes.js';
import {
  createEmployeeController,
  employeeDetailController,
  employeesController,
  updateEmployeeController,
} from './employee.controller.js';

export const employeeRouter = Router();

const requireEmployeeView = requirePermission('employee.master.view');
const requireEmployeeManage = requirePermission('employee.master.manage');

employeeRouter.get('/', requireEmployeeView, employeesController);
employeeRouter.get('/:id', requireEmployeeView, employeeDetailController);
employeeRouter.post('/', requireEmployeeManage, createEmployeeController);
employeeRouter.put('/:id', requireEmployeeManage, updateEmployeeController);

employeeRouter.use(
  '/:employeeId/organization-assignments',
  employeeAssignmentRouter
);

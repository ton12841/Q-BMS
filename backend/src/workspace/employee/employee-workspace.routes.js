import { Router } from 'express';
import { getMyEmployeeWorkspaceController } from './employee-workspace.controller.js';

export const employeeWorkspaceRouter = Router();

employeeWorkspaceRouter.get('/me', getMyEmployeeWorkspaceController);

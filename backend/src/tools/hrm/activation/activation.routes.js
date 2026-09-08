import { Router } from 'express';
import {
  activateEmployeeController,
  getActivationController,
  listActivationsController,
} from './activation.controller.js';

export const activationRouter = Router();
activationRouter.get('/', listActivationsController);
activationRouter.get('/:employeeId', getActivationController);
activationRouter.post('/:employeeId/activate', activateEmployeeController);

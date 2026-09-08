import { Router } from 'express';
import {
  assignExistingController,
  completeWithAssetsController,
  getGateController,
  listGatesController,
  noAssetRequiredController,
  registerAndAssignController,
  removeAssignmentController,
} from './asset-gate.controller.js';

export const assetGateRouter = Router();
assetGateRouter.get('/', listGatesController);
assetGateRouter.get('/:employeeId', getGateController);
assetGateRouter.post('/:employeeId/assets/register-and-assign', registerAndAssignController);
assetGateRouter.post('/:employeeId/assets/:assetId/assign', assignExistingController);
assetGateRouter.post('/:employeeId/assignments/:assignmentId/return', removeAssignmentController);
assetGateRouter.post('/:employeeId/complete-with-assets', completeWithAssetsController);
assetGateRouter.post('/:employeeId/no-asset-required', noAssetRequiredController);

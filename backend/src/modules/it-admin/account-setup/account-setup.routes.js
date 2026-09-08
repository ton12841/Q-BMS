import { Router } from 'express';
import {
  accountSetupQueueController,
  completeAccountSetupController,
  startAccountSetupController,
} from './account-setup.controller.js';

export const accountSetupRouter = Router();

accountSetupRouter.get('/', accountSetupQueueController);
accountSetupRouter.patch('/:id/start', startAccountSetupController);
accountSetupRouter.patch('/:id/complete', completeAccountSetupController);

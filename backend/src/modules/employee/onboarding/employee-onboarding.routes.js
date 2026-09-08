import { Router } from 'express';
import {
  acknowledgePolicyController,
  addDocumentController,
  getMyOnboardingController,
  saveBankController,
  saveEmergencyController,
  savePersonalController,
  submitOnboardingController,
} from './employee-onboarding.controller.js';

export const employeeOnboardingRouter = Router();

employeeOnboardingRouter.get('/me', getMyOnboardingController);
employeeOnboardingRouter.put('/me/personal', savePersonalController);
employeeOnboardingRouter.put('/me/emergency', saveEmergencyController);
employeeOnboardingRouter.put('/me/bank', saveBankController);
employeeOnboardingRouter.post('/me/documents', addDocumentController);
employeeOnboardingRouter.post('/me/policy/acknowledge', acknowledgePolicyController);
employeeOnboardingRouter.post('/me/submit', submitOnboardingController);

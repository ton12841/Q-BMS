import { Router } from 'express';
import { getOnboardingE2EQaController, listOnboardingE2EQaController } from './onboarding-e2e.controller.js';

export const onboardingE2EQaRouter = Router();
onboardingE2EQaRouter.get('/', listOnboardingE2EQaController);
onboardingE2EQaRouter.get('/:employeeId', getOnboardingE2EQaController);

import { Router } from 'express';
import {
  approveReviewController,
  getReviewController,
  listReviewsController,
  requestChangesController,
} from './onboarding-review.controller.js';

export const onboardingReviewRouter = Router();

onboardingReviewRouter.get('/', listReviewsController);
onboardingReviewRouter.get('/:employeeId', getReviewController);
onboardingReviewRouter.post('/:employeeId/request-changes', requestChangesController);
onboardingReviewRouter.post('/:employeeId/approve', approveReviewController);

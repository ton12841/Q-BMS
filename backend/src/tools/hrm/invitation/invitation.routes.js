import { Router } from 'express';
import {
  invitationQueueController,
  queueInvitationController,
  revokeInvitationController,
} from './invitation.controller.js';

export const invitationRouter = Router();

invitationRouter.get('/', invitationQueueController);
invitationRouter.post('/:employeeId/queue', queueInvitationController);
invitationRouter.post('/:employeeId/revoke', revokeInvitationController);

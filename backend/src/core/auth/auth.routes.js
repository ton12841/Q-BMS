import { Router } from 'express';
import {
  getAuthConfig,
  getInvitationPreview,
  getSession,
  googleCallback,
  logout,
  startDevelopmentPreview,
  startGoogleSignIn,
} from './auth.controller.js';

export const authRouter = Router();

authRouter.get('/config', getAuthConfig);
authRouter.get('/session', getSession);
authRouter.get('/invitations/:publicId', getInvitationPreview);
authRouter.get('/google/start', startGoogleSignIn);
authRouter.get('/google/callback', googleCallback);
authRouter.post('/logout', logout);
authRouter.post('/development-session', startDevelopmentPreview);

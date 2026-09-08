import { Router } from 'express';
import { getUserIdentityOverview } from './user-identity.service.js';

export const userIdentityRouter = Router();

userIdentityRouter.get('/overview', async (req, res) => {
  try {
    const data = await getUserIdentityOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'USER_IDENTITY_OVERVIEW_FAILED',
      message: error.message || 'Unable to load User & Identity Management.',
    });
  }
});

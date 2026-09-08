import { Router } from 'express';
import { getPlatformDiagnosticsOverview } from './platform-diagnostics.service.js';

export const platformDiagnosticsRouter = Router();

platformDiagnosticsRouter.get('/overview', async (req, res) => {
  try {
    const data = await getPlatformDiagnosticsOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'PLATFORM_DIAGNOSTICS_FAILED',
      message: error.message || 'Unable to run Platform Diagnostics.',
    });
  }
});

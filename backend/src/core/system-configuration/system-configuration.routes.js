import { Router } from 'express';
import { getSystemConfigurationOverview } from './system-configuration.service.js';

export const systemConfigurationRouter = Router();

systemConfigurationRouter.get('/overview', async (req, res) => {
  try {
    const data = await getSystemConfigurationOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'SYSTEM_CONFIGURATION_OVERVIEW_FAILED',
      message: error.message || 'Unable to load System Configuration.',
    });
  }
});

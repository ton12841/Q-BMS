import { Router } from 'express';
import { getModuleManagementOverview } from './module-management.service.js';

export const moduleManagementRouter = Router();

moduleManagementRouter.get('/overview', async (req, res) => {
  try {
    const data = await getModuleManagementOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'MODULE_MANAGEMENT_OVERVIEW_FAILED',
      message: error.message || 'Unable to load Module Management.',
    });
  }
});

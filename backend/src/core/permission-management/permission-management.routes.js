import { Router } from 'express';
import { getPermissionManagementOverview } from './permission-management.service.js';

export const permissionManagementRouter = Router();

permissionManagementRouter.get('/overview', async (req, res) => {
  try {
    const data = await getPermissionManagementOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'PERMISSION_MANAGEMENT_OVERVIEW_FAILED',
      message: error.message || 'Unable to load Permission Management.',
    });
  }
});

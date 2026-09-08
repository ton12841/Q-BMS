import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import {
  getAccessControlOverview,
  updateAccessControlUserRoles,
  getOrganizationPermissionPolicy,
  updateJobGradePermissionPolicy,
  updateJobLevelPermissionPolicy,
  getUserEffectivePermissionPreview,
  simulateEffectivePermissionPreview,
} from './access-control.service.js';

export const accessControlRouter = Router();

accessControlRouter.get('/overview', async (req, res) => {
  try {
    const data = await getAccessControlOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'ACCESS_CONTROL_OVERVIEW_FAILED',
      message: error.message || 'Unable to load Access Control.',
    });
  }
});

accessControlRouter.put(
  '/users/:userId/roles',
  requirePermission('system.access_control.manage'),
  async (req, res) => {
    try {
      const data = await updateAccessControlUserRoles({
        userId: req.params.userId,
        roleCodes: req.body?.roleCodes,
        actorUserId: req.auth?.user?.id || null,
      });

      res.json({
        success: true,
        data,
        message: 'Q BMS user roles updated.',
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || 'ACCESS_CONTROL_UPDATE_FAILED',
        message: error.message || 'Unable to update Q BMS user roles.',
      });
    }
  }
);

accessControlRouter.get('/organization-policy', async (req, res) => {
  try {
    const data = await getOrganizationPermissionPolicy();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'ORGANIZATION_PERMISSION_POLICY_FAILED',
      message: error.message || 'Unable to load Level / Grade permission policy.',
    });
  }
});

accessControlRouter.put(
  '/organization-policy/levels/:jobLevelId',
  requirePermission('system.access_control.manage'),
  async (req, res) => {
    try {
      const data = await updateJobLevelPermissionPolicy({
        jobLevelId: req.params.jobLevelId,
        permissionCodes: req.body?.permissionCodes,
        actorUserId: req.auth?.user?.id || null,
      });

      res.json({
        success: true,
        data,
        message: 'Job Level permission policy updated.',
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || 'JOB_LEVEL_PERMISSION_POLICY_UPDATE_FAILED',
        message: error.message || 'Unable to update Job Level permission policy.',
      });
    }
  }
);

accessControlRouter.put(
  '/organization-policy/grades/:jobGradeId',
  requirePermission('system.access_control.manage'),
  async (req, res) => {
    try {
      const data = await updateJobGradePermissionPolicy({
        jobGradeId: req.params.jobGradeId,
        overrides: req.body?.overrides,
        actorUserId: req.auth?.user?.id || null,
      });

      res.json({
        success: true,
        data,
        message: 'Job Grade permission override updated.',
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || 'JOB_GRADE_PERMISSION_POLICY_UPDATE_FAILED',
        message: error.message || 'Unable to update Job Grade permission policy.',
      });
    }
  }
);

accessControlRouter.get('/effective-preview/users/:userId', async (req, res) => {
  try {
    const data = await getUserEffectivePermissionPreview(req.params.userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'EFFECTIVE_PERMISSION_PREVIEW_FAILED',
      message: error.message || 'Unable to preview effective permissions.',
    });
  }
});

accessControlRouter.post('/effective-preview/simulate', async (req, res) => {
  try {
    const data = await simulateEffectivePermissionPreview({
      roleCodes: req.body?.roleCodes,
      jobLevelId: req.body?.jobLevelId || null,
      jobGradeId: req.body?.jobGradeId || null,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'EFFECTIVE_PERMISSION_SIMULATION_FAILED',
      message: error.message || 'Unable to simulate effective permissions.',
    });
  }
});


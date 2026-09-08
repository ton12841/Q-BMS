import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import {
  createRoleManagementRole,
  getRoleManagementOverview,
  updateRoleManagementRoleService,
} from './role-management.service.js';

export const roleManagementRouter = Router();

roleManagementRouter.get('/overview', async (req, res) => {
  try {
    const data = await getRoleManagementOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'ROLE_MANAGEMENT_OVERVIEW_FAILED',
      message: error.message || 'Unable to load Role Management.',
    });
  }
});

roleManagementRouter.post(
  '/roles',
  requirePermission('system.role_management.manage'),
  async (req, res) => {
    try {
      const data = await createRoleManagementRole({
        code: req.body?.code,
        name: req.body?.name,
        description: req.body?.description,
        permissionCodes: req.body?.permissionCodes,
        actorUserId: req.auth?.user?.id || null,
      });

      res.status(201).json({
        success: true,
        data,
        message: 'Custom Admin Role created.',
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || 'ROLE_MANAGEMENT_CREATE_FAILED',
        message: error.message || 'Unable to create Role.',
      });
    }
  }
);

roleManagementRouter.put(
  '/roles/:roleId',
  requirePermission('system.role_management.manage'),
  async (req, res) => {
    try {
      const data = await updateRoleManagementRoleService({
        roleId: req.params.roleId,
        name: req.body?.name,
        description: req.body?.description,
        status: req.body?.status,
        permissionCodes: req.body?.permissionCodes,
        actorUserId: req.auth?.user?.id || null,
      });

      res.json({
        success: true,
        data,
        message: 'Role updated.',
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || 'ROLE_MANAGEMENT_UPDATE_FAILED',
        message: error.message || 'Unable to update Role.',
      });
    }
  }
);

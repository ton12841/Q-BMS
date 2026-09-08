import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './core/health/health.routes.js';
import { authRouter } from './core/auth/auth.routes.js';
import { organizationRouter } from './modules/organization/organization.routes.js';
import { employeeRouter } from './modules/employee/employee.routes.js';
import { accountSetupRouter } from './modules/it-admin/account-setup/account-setup.routes.js';
import { invitationRouter } from './tools/hrm/invitation/invitation.routes.js';
import { employeeOnboardingRouter } from './modules/employee/onboarding/employee-onboarding.routes.js';
import { onboardingReviewRouter } from './tools/hrm/onboarding-review/onboarding-review.routes.js';
import { assetGateRouter } from './tools/hrm/asset-gate/asset-gate.routes.js';
import { activationRouter } from './tools/hrm/activation/activation.routes.js';
import { employeeWorkspaceRouter } from './workspace/employee/employee-workspace.routes.js';
import { onboardingE2EQaRouter } from './qa/onboarding-e2e/onboarding-e2e.routes.js';
import { accessControlRouter } from './core/access-control/access-control.routes.js';
import { userIdentityRouter } from './core/user-identity/user-identity.routes.js';
import { auditLogRouter } from './core/audit-log/audit-log.routes.js';
import { roleManagementRouter } from './core/role-management/role-management.routes.js';
import { permissionManagementRouter } from './core/permission-management/permission-management.routes.js';
import { moduleManagementRouter } from './core/module-management/module-management.routes.js';
import { systemConfigurationRouter } from './core/system-configuration/system-configuration.routes.js';
import { platformDiagnosticsRouter } from './core/platform-diagnostics/platform-diagnostics.routes.js';
import { requireAuthenticatedUser, requirePermission, requireWorkspaceSession } from './middleware/auth.middleware.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

// Public/system routes.
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Q BMS application APIs require a valid workspace session. During local
// development a Development Preview session is intentionally accepted.
app.use(requireWorkspaceSession);
app.use('/api/onboarding', requireAuthenticatedUser, employeeOnboardingRouter);
app.use('/api/workspace/employee', requireAuthenticatedUser, employeeWorkspaceRouter);
app.use('/api/super-admin/access-control', requirePermission('system.access_control.view'), accessControlRouter);
app.use('/api/super-admin/user-identity', requirePermission('system.user_identity.view'), userIdentityRouter);
app.use('/api/super-admin/audit-log', requirePermission('system.audit_log.view'), auditLogRouter);
app.use('/api/super-admin/role-management', requirePermission('system.role_management.view'), roleManagementRouter);
app.use('/api/super-admin/permission-management', requirePermission('system.permission_management.view'), permissionManagementRouter);
app.use('/api/super-admin/module-management', requirePermission('system.module_management.view'), moduleManagementRouter);
app.use('/api/super-admin/system-configuration', requirePermission('system.configuration.view'), systemConfigurationRouter);
app.use('/api/super-admin/platform-diagnostics', requirePermission('system.platform_diagnostics.view'), platformDiagnosticsRouter);
// Development-only, read-only E2E QA checkpoint. Never expose this route in production.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/qa/onboarding-e2e', onboardingE2EQaRouter);
}
app.use('/api/organization', organizationRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/it-admin/account-setup', requirePermission('employee.account_setup.manage'), accountSetupRouter);
app.use('/api/hrm/invitations', requirePermission('employee.invitation.manage'), invitationRouter);
app.use('/api/hrm/onboarding-reviews', requirePermission('employee.onboarding.manage'), onboardingReviewRouter);
app.use('/api/hrm/asset-gates', requirePermission('employee.onboarding.manage'), assetGateRouter);
app.use('/api/hrm/activations', requirePermission('employee.onboarding.manage'), activationRouter);
// Temporary compatibility alias for v2.0.14.0 clients/bookmarks.
app.use('/api/employee-account-setup', requirePermission('employee.account_setup.manage'), accountSetupRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;

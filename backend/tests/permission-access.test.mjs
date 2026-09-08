import assert from 'node:assert/strict';
import { evaluatePermissionAccess } from '../src/core/access-control/permission-access.policy.js';

export async function run() {
  assert.equal(
    evaluatePermissionAccess({ sessionKind: 'DEVELOPMENT_PREVIEW' }, 'x', { nodeEnv: 'development' }).allowed,
    true
  );
  assert.equal(
    evaluatePermissionAccess({ sessionKind: 'DEVELOPMENT_PREVIEW' }, 'x', { nodeEnv: 'production' }).allowed,
    false
  );
  assert.equal(
    evaluatePermissionAccess({}, 'x', { nodeEnv: 'production' }).statusCode,
    401
  );
  assert.equal(
    evaluatePermissionAccess({ identityVerified: true, user: { id: '1' }, permissions: ['organization.master.view'] }, 'organization.master.view').allowed,
    true
  );
  assert.equal(
    evaluatePermissionAccess({ identityVerified: true, user: { id: '1' }, permissions: [] }, 'organization.master.manage').statusCode,
    403
  );
  assert.equal(
    evaluatePermissionAccess({ identityVerified: true, user: { id: '1' }, isSuperAdmin: true, permissions: [] }, 'organization.master.manage').allowed,
    true
  );
}

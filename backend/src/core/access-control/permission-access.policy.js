export function evaluatePermissionAccess(auth, permissionCode, { nodeEnv = process.env.NODE_ENV } = {}) {
  if (auth?.sessionKind === 'DEVELOPMENT_PREVIEW' && nodeEnv !== 'production') {
    return { allowed: true, reason: 'DEVELOPMENT_PREVIEW' };
  }

  if (!auth?.identityVerified || !auth?.user) {
    return { allowed: false, statusCode: 401, reason: 'AUTHENTICATION_REQUIRED' };
  }

  if (auth.isSuperAdmin || auth.permissions?.includes(permissionCode)) {
    return { allowed: true, reason: auth.isSuperAdmin ? 'SUPER_ADMIN' : 'PERMISSION' };
  }

  return { allowed: false, statusCode: 403, reason: 'PERMISSION_REQUIRED' };
}

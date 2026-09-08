import { SESSION_COOKIE_NAME } from '../core/auth/auth.constants.js';
import { getSessionContext } from '../core/auth/auth.service.js';
import { evaluatePermissionAccess } from '../core/access-control/permission-access.policy.js';

export { evaluatePermissionAccess } from '../core/access-control/permission-access.policy.js';

function readCookie(cookieHeader = '', name) {
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) continue;

    const key = decodeURIComponent(trimmed.slice(0, separatorIndex).trim());
    if (key !== name) continue;

    return decodeURIComponent(trimmed.slice(separatorIndex + 1).trim());
  }

  return null;
}

export async function requireWorkspaceSession(req, res, next) {
  try {
    const token = readCookie(req.headers.cookie || '', SESSION_COOKIE_NAME);
    const session = await getSessionContext(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'A valid Q BMS session is required.',
      });
    }

    req.auth = session;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuthenticatedUser(req, res, next) {
  return requireWorkspaceSession(req, res, () => {
    if (!req.auth?.identityVerified || !req.auth?.user) {
      return res.status(401).json({
        success: false,
        message: 'A verified Q BMS user identity is required.',
      });
    }

    next();
  });
}

export function requirePermission(permissionCode) {
  return (req, res, next) => {
    const decision = evaluatePermissionAccess(req.auth, permissionCode);

    if (decision.allowed) {
      return next();
    }

    if (decision.statusCode === 401) {
      return res.status(401).json({ success: false, message: 'Authentication is required.' });
    }

    return res.status(403).json({
      success: false,
      message: `Permission required: ${permissionCode}`,
    });
  };
}

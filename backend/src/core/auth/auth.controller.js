import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_MINUTES,
  SESSION_COOKIE_NAME,
  SESSION_TTL_HOURS,
} from './auth.constants.js';
import {
  createDevelopmentPreviewSession,
  createUserSession,
  finishGoogleOauth,
  getInvitationActivationPreview,
  getPublicAuthConfig,
  getSessionContext,
  revokeRawSession,
  safeReturnPath,
  startGoogleOauth,
} from './auth.service.js';

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) return cookies;

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function readCookie(req, name) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[name] || null;
}

function readSessionToken(req) {
  return readCookie(req, SESSION_COOKIE_NAME);
}

function commonCookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  const domain = process.env.SESSION_COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
  };
}

function sessionCookieOptions() {
  return {
    ...commonCookieOptions(),
    maxAge: SESSION_TTL_HOURS * 60 * 60 * 1000,
  };
}

function oauthCookieOptions() {
  return {
    ...commonCookieOptions(),
    maxAge: OAUTH_STATE_TTL_MINUTES * 60 * 1000,
  };
}

function clearCookieOptions() {
  return commonCookieOptions();
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function frontendRedirect(path = '/', params = {}) {
  const url = new URL(safeReturnPath(path), `${frontendUrl()}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function authErrorRedirect(error, invitationPublicId = null) {
  const code = error?.code || 'AUTHENTICATION_FAILED';
  const message = error instanceof Error ? error.message : 'Authentication failed.';

  if (invitationPublicId) {
    return frontendRedirect(`/activate/${invitationPublicId}`, { error: code, message });
  }
  return frontendRedirect('/login', { error: code, message });
}

export async function getAuthConfig(req, res) {
  return res.json({ success: true, data: getPublicAuthConfig() });
}

export async function getSession(req, res, next) {
  try {
    const session = await getSessionContext(readSessionToken(req));

    if (!session) {
      return res.json({
        success: true,
        data: {
          hasWorkspaceSession: false,
          identityVerified: false,
          sessionKind: null,
          canAccessWorkspace: false,
          requiresProfileSetup: false,
          onboardingStage: null,
          isSuperAdmin: false,
          user: null,
          employment: null,
          roles: [],
          permissions: [],
        },
      });
    }

    return res.json({
      success: true,
      data: {
        hasWorkspaceSession: true,
        ...session,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvitationPreview(req, res, next) {
  try {
    const result = await getInvitationActivationPreview(req.params.publicId);
    return res.status(result.found ? 200 : result.httpStatus || 404).json({
      success: result.found,
      data: result,
      message: result.message || undefined,
    });
  } catch (error) {
    next(error);
  }
}

export async function startGoogleSignIn(req, res) {
  const invitationPublicId = String(req.query.invite || '').trim() || null;

  try {
    const { state, authorizationUrl } = await startGoogleOauth({
      invitationPublicId,
      returnPath: req.query.next || '/',
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.cookie(OAUTH_STATE_COOKIE_NAME, state, oauthCookieOptions());
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    return res.redirect(302, authErrorRedirect(error, invitationPublicId));
  }
}

export async function googleCallback(req, res) {
  const state = String(req.query.state || '');
  const code = String(req.query.code || '');
  const stateCookie = readCookie(req, OAUTH_STATE_COOKIE_NAME);
  let invitationPublicId = null;

  try {
    if (req.query.error) {
      const error = new Error(String(req.query.error_description || req.query.error));
      error.code = 'GOOGLE_SIGN_IN_CANCELLED';
      throw error;
    }

    const result = await finishGoogleOauth({ code, state, stateCookie });
    invitationPublicId = result.invitationPublicId || null;

    const currentToken = readSessionToken(req);
    if (currentToken) {
      await revokeRawSession(currentToken);
    }

    const { token } = await createUserSession({
      userId: result.user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
      metadata: {
        auth_provider: 'GOOGLE',
        google_subject: result.identity.subject,
        invitation_public_id: invitationPublicId,
      },
    });

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, clearCookieOptions());

    const session = await getSessionContext(token);
    if (session?.requiresProfileSetup || !session?.canAccessWorkspace) {
      return res.redirect(302, frontendRedirect('/onboarding/profile'));
    }

    return res.redirect(302, frontendRedirect(result.returnPath || '/'));
  } catch (error) {
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, clearCookieOptions());
    return res.redirect(302, authErrorRedirect(error, error?.invitationPublicId || invitationPublicId));
  }
}

export async function startDevelopmentPreview(req, res, next) {
  try {
    const currentToken = readSessionToken(req);
    if (currentToken) {
      await revokeRawSession(currentToken);
    }

    const { token, expiresAt } = await createDevelopmentPreviewSession({
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());

    return res.status(201).json({
      success: true,
      data: {
        hasWorkspaceSession: true,
        identityVerified: false,
        sessionKind: 'DEVELOPMENT_PREVIEW',
        canAccessWorkspace: true,
        requiresProfileSetup: false,
        onboardingStage: null,
        isSuperAdmin: false,
        expiresAt,
        user: null,
        employment: null,
        roles: [],
        permissions: [],
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const rawToken = readSessionToken(req);
    await revokeRawSession(rawToken);
    res.clearCookie(SESSION_COOKIE_NAME, clearCookieOptions());
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, clearCookieOptions());

    return res.json({
      success: true,
      data: { loggedOut: true },
    });
  } catch (error) {
    next(error);
  }
}

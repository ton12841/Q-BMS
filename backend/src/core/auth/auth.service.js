import crypto from 'node:crypto';
import { isLoopbackAddress } from './development-preview.policy.js';
import {
  OAUTH_STATE_TTL_MINUTES,
  SESSION_KINDS,
  SESSION_TTL_HOURS,
} from './auth.constants.js';
import {
  authenticateGoogleIdentity,
  consumeOauthState,
  findActiveSession,
  findInvitationPreview,
  findRolesAndPermissions,
  insertOauthState,
  insertSession,
  revokeSession,
  touchSession,
} from './auth.repository.js';
import {
  buildGoogleAuthorizationUrl,
  createPkcePair,
  exchangeGoogleAuthorizationCode,
  fetchGoogleIdentity,
  getGoogleOauthConfig,
  isGoogleOauthConfigured,
} from './auth.google.js';

export function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashSessionToken(token) {
  return hashOpaqueToken(token);
}

function generateOpaqueToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
}

function oauthStateExpiry() {
  return new Date(Date.now() + OAUTH_STATE_TTL_MINUTES * 60 * 1000);
}

export function safeReturnPath(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value.slice(0, 1000);
}

export function getPublicAuthConfig() {
  const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN?.trim().toLowerCase() || null;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || null;
  const required = {
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID?.trim(),
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
    GOOGLE_OAUTH_REDIRECT_URI: redirectUri,
    GOOGLE_WORKSPACE_DOMAIN: workspaceDomain,
  };

  return {
    googleSsoConfigured: isGoogleOauthConfigured(),
    workspaceDomain,
    redirectUri,
    runtimeEnvironment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    missingConfiguration: Object.entries(required)
      .filter(([, value]) => !value)
      .map(([name]) => name),
  };
}

export async function createUserSession({
  userId,
  ipAddress,
  userAgent,
  metadata = {},
}) {
  if (!userId) {
    throw new Error('A user ID is required for a user session.');
  }

  const token = generateOpaqueToken();
  const expiresAt = sessionExpiry();

  await insertSession({
    tokenHash: hashSessionToken(token),
    userId,
    sessionKind: SESSION_KINDS.USER,
    expiresAt,
    ipAddress,
    userAgent,
    metadata,
  });

  return { token, expiresAt };
}

export async function createDevelopmentPreviewSession({
  ipAddress,
  userAgent,
}) {
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Development preview is not available in production.');
    error.statusCode = 403;
    throw error;
  }

  if (!isLoopbackAddress(ipAddress)) {
    const error = new Error('Development preview is restricted to the local machine.');
    error.statusCode = 403;
    error.code = 'DEVELOPMENT_PREVIEW_LOCAL_ONLY';
    throw error;
  }

  const token = generateOpaqueToken();
  const expiresAt = sessionExpiry();

  await insertSession({
    tokenHash: hashSessionToken(token),
    userId: null,
    sessionKind: SESSION_KINDS.DEVELOPMENT_PREVIEW,
    expiresAt,
    ipAddress,
    userAgent,
    metadata: {
      purpose: 'LOCAL_DEVELOPMENT_WORKSPACE_PREVIEW',
      identity_verified: false,
    },
  });

  return { token, expiresAt };
}

export async function startGoogleOauth({
  invitationPublicId,
  returnPath,
  ipAddress,
  userAgent,
}) {
  getGoogleOauthConfig();

  if (invitationPublicId) {
    const invitation = await getInvitationActivationPreview(invitationPublicId);
    if (!invitation.canActivate) {
      const error = new Error(invitation.message || 'This invitation cannot be activated.');
      error.statusCode = invitation.httpStatus || 409;
      error.code = invitation.code || 'INVITATION_NOT_ACTIVE';
      throw error;
    }
  }

  const state = generateOpaqueToken();
  const { verifier, challenge } = createPkcePair();

  await insertOauthState({
    stateHash: hashOpaqueToken(state),
    codeVerifier: verifier,
    invitationPublicId: invitationPublicId || null,
    returnPath: safeReturnPath(returnPath),
    expiresAt: oauthStateExpiry(),
    ipAddress,
    userAgent,
  });

  return {
    state,
    authorizationUrl: buildGoogleAuthorizationUrl({
      state,
      codeChallenge: challenge,
    }),
  };
}

export async function finishGoogleOauth({ code, state, stateCookie }) {
  if (!code || !state || !stateCookie || state !== stateCookie) {
    const error = new Error('Google sign-in state validation failed. Please start again from Q BMS.');
    error.statusCode = 401;
    error.code = 'OAUTH_STATE_INVALID';
    throw error;
  }

  const oauthState = await consumeOauthState(hashOpaqueToken(state));
  if (!oauthState) {
    const error = new Error('Google sign-in has expired or was already used. Please try again.');
    error.statusCode = 401;
    error.code = 'OAUTH_STATE_EXPIRED';
    throw error;
  }

  try {
    const tokenPayload = await exchangeGoogleAuthorizationCode({
      code,
      codeVerifier: oauthState.code_verifier,
    });

    const identity = await fetchGoogleIdentity(tokenPayload.access_token);
    const user = await authenticateGoogleIdentity({
      identity,
      invitationPublicId: oauthState.invitation_public_id,
    });

    return {
      user,
      identity,
      returnPath: safeReturnPath(oauthState.return_path),
      invitationPublicId: oauthState.invitation_public_id,
    };
  } catch (error) {
    if (error && typeof error === 'object') {
      error.invitationPublicId = oauthState.invitation_public_id || null;
    }
    throw error;
  }
}

function maskEmail(email) {
  const normalized = String(email || '').trim();
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${'*'.repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
}

export async function getInvitationActivationPreview(publicId) {
  if (!publicId) {
    return {
      found: false,
      canActivate: false,
      code: 'INVITATION_REQUIRED',
      message: 'Invitation ID is required.',
      httpStatus: 400,
    };
  }

  const invitation = await findInvitationPreview(publicId);
  if (!invitation) {
    return {
      found: false,
      canActivate: false,
      code: 'INVITATION_NOT_FOUND',
      message: 'This Q BMS invitation was not found.',
      httpStatus: 404,
    };
  }

  const expired = !invitation.expires_at || new Date(invitation.expires_at) <= new Date();
  let canActivate = ['QUEUED', 'SENT'].includes(invitation.invitation_status) && !expired;
  let code = null;
  let message = null;
  let httpStatus = 200;

  if (invitation.invitation_status === 'ACCEPTED') {
    canActivate = false;
    code = 'INVITATION_ACCEPTED';
    message = 'This invitation has already been activated. You can sign in from the Q BMS login page.';
    httpStatus = 409;
  } else if (expired) {
    canActivate = false;
    code = 'INVITATION_EXPIRED';
    message = 'This invitation has expired. Please ask HR to send a new invitation.';
    httpStatus = 410;
  } else if (!canActivate) {
    code = 'INVITATION_NOT_ACTIVE';
    message = 'This invitation is not active. Please contact HR.';
    httpStatus = 409;
  }

  return {
    found: true,
    canActivate,
    code,
    message,
    httpStatus,
    invitation: {
      publicId: invitation.public_id,
      employeeCode: invitation.employee_code,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      nickname: invitation.nickname,
      displayName:
        [invitation.first_name, invitation.last_name].filter(Boolean).join(' ').trim() ||
        invitation.employee_code,
      invitedEmailMasked: maskEmail(invitation.invited_email),
      invitationStatus: invitation.invitation_status,
      expiresAt: invitation.expires_at,
      employeeStatus: invitation.employee_status,
      profileStatus: invitation.profile_status,
    },
  };
}

export async function getSessionContext(rawToken) {
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashSessionToken(rawToken);
  const session = await findActiveSession(tokenHash);

  if (!session) {
    return null;
  }

  await touchSession(session.id);

  if (session.session_kind === SESSION_KINDS.DEVELOPMENT_PREVIEW) {
    return {
      sessionId: String(session.id),
      sessionKind: session.session_kind,
      expiresAt: session.expires_at,
      identityVerified: false,
      canAccessWorkspace: true,
      requiresProfileSetup: false,
      onboardingStage: null,
      isSuperAdmin: false,
      user: null,
      employment: null,
      roles: [],
      permissions: [],
    };
  }

  const access = await findRolesAndPermissions({
    userId: session.user_id,
    jobLevelId: session.job_level_id || null,
    jobGradeId: session.job_grade_id || null,
  });
  const displayName = [session.first_name, session.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const profileStatus = session.profile_status || 'NOT_STARTED';
  const accountStatus = String(session.account_status || '').toUpperCase();
  const employeeStatus = String(session.employee_status || '').toUpperCase();
  const requiresProfileSetup = ['NOT_STARTED', 'IN_PROGRESS'].includes(profileStatus);
  const awaitingHrReview = profileStatus === 'SUBMITTED' || accountStatus === 'ONBOARDING';
  const canAccessWorkspace =
    accountStatus === 'ACTIVE' &&
    employeeStatus === 'ACTIVE' &&
    profileStatus === 'COMPLETE';
  const isSuperAdmin = access.roles.some((role) => role.code === 'SUPER_ADMIN');

  let onboardingStage = null;
  if (requiresProfileSetup) onboardingStage = 'PROFILE_SETUP';
  else if (!canAccessWorkspace && awaitingHrReview) onboardingStage = 'HR_REVIEW';

  return {
    sessionId: String(session.id),
    sessionKind: session.session_kind,
    expiresAt: session.expires_at,
    identityVerified: true,
    canAccessWorkspace,
    requiresProfileSetup,
    onboardingStage,
    isSuperAdmin,
    user: {
      id: String(session.user_id),
      employeeId: session.employee_id ? String(session.employee_id) : null,
      employeeCode: session.employee_code || null,
      email: session.email || null,
      accountStatus: session.account_status || null,
      employeeStatus: session.employee_status || null,
      profileStatus,
      firstName: session.first_name || null,
      lastName: session.last_name || null,
      nickname: session.nickname || null,
      displayName: displayName || session.email || 'Q BMS User',
    },
    employment: session.employee_id
      ? {
          businessUnitId: session.business_unit_id ? String(session.business_unit_id) : null,
          businessUnitCode: session.business_unit_code || null,
          businessUnitName: session.business_unit_name || null,
          positionId: session.position_id ? String(session.position_id) : null,
          positionCode: session.position_code || null,
          positionName: session.position_name || null,
          jobGradeId: session.job_grade_id ? String(session.job_grade_id) : null,
          gradeNumber: session.grade_number ?? null,
          jobGradeName: session.job_grade_name || null,
          jobLevelId: session.job_level_id ? String(session.job_level_id) : null,
          jobLevelCode: session.job_level_code || null,
          jobLevelName: session.job_level_name || null,
        }
      : null,
    accessPolicy: {
      jobLevelId: session.job_level_id ? String(session.job_level_id) : null,
      jobGradeId: session.job_grade_id ? String(session.job_grade_id) : null,
      rolePermissions: access.rolePermissions,
      levelPermissions: access.levelPermissions,
      gradeGrantedPermissions: access.gradeGrantedPermissions,
      gradeRevokedPermissions: access.gradeRevokedPermissions,
      rule: 'ROLE + (GRADE override LEVEL)',
    },
    roles: access.roles.map((role) => ({
      code: role.code,
      name: role.name,
      isSystemRole: Boolean(role.is_system_role),
    })),
    permissions: isSuperAdmin
      ? Array.from(new Set(['system.super_admin', ...access.permissions]))
      : access.permissions,
  };
}

export async function revokeRawSession(rawToken) {
  if (!rawToken) {
    return;
  }

  await revokeSession(hashSessionToken(rawToken));
}

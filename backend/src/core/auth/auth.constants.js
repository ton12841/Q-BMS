const parsedSessionTtlHours = Number(process.env.SESSION_TTL_HOURS || 8);
const parsedOauthStateTtlMinutes = Number(process.env.OAUTH_STATE_TTL_MINUTES || 10);

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || 'qbms_session';

export const OAUTH_STATE_COOKIE_NAME =
  process.env.OAUTH_STATE_COOKIE_NAME || 'qbms_oauth_state';

export const SESSION_TTL_HOURS = Number.isFinite(parsedSessionTtlHours)
  ? Math.max(1, parsedSessionTtlHours)
  : 8;

export const OAUTH_STATE_TTL_MINUTES = Number.isFinite(parsedOauthStateTtlMinutes)
  ? Math.max(5, parsedOauthStateTtlMinutes)
  : 10;

export const SESSION_KINDS = {
  USER: 'USER',
  DEVELOPMENT_PREVIEW: 'DEVELOPMENT_PREVIEW',
};

export const USER_ACCOUNT_STATUS = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
};

export const GOOGLE_OAUTH_SCOPE = 'openid email profile';

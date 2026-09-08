import crypto from 'node:crypto';
import { GOOGLE_OAUTH_SCOPE } from './auth.constants.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    const error = new Error(`Google Workspace SSO is not configured: ${name} is missing.`);
    error.statusCode = 503;
    error.code = 'GOOGLE_SSO_NOT_CONFIGURED';
    throw error;
  }
  return value;
}

export function getGoogleOauthConfig() {
  return {
    clientId: requiredEnv('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirectUri: requiredEnv('GOOGLE_OAUTH_REDIRECT_URI'),
    workspaceDomain: requiredEnv('GOOGLE_WORKSPACE_DOMAIN').toLowerCase(),
  };
}

export function isGoogleOauthConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() &&
      process.env.GOOGLE_WORKSPACE_DOMAIN?.trim()
  );
}

export function createPkcePair() {
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

export function buildGoogleAuthorizationUrl({ state, codeChallenge }) {
  const config = getGoogleOauthConfig();
  const url = new URL(GOOGLE_AUTH_URL);

  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_OAUTH_SCOPE);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('hd', config.workspaceDomain);

  return url.toString();
}

async function parseGoogleResponse(response, label) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      payload?.error_description || payload?.error?.message || `${label} failed.`
    );
    error.statusCode = 401;
    error.code = 'GOOGLE_AUTHENTICATION_FAILED';
    throw error;
  }
  return payload;
}

export async function exchangeGoogleAuthorizationCode({ code, codeVerifier }) {
  const config = getGoogleOauthConfig();
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return parseGoogleResponse(response, 'Google token exchange');
}

export async function fetchGoogleIdentity(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await parseGoogleResponse(response, 'Google identity lookup');
  const email = String(payload?.email || '').trim().toLowerCase();
  const subject = String(payload?.sub || '').trim();
  const config = getGoogleOauthConfig();
  const domain = email.includes('@') ? email.split('@').pop() : '';

  if (!subject || !email || payload?.email_verified !== true) {
    const error = new Error('Google did not return a verified account identity.');
    error.statusCode = 401;
    error.code = 'GOOGLE_IDENTITY_INVALID';
    throw error;
  }

  if (domain !== config.workspaceDomain) {
    const error = new Error(
      `Please sign in with your ${config.workspaceDomain} Google Workspace account.`
    );
    error.statusCode = 403;
    error.code = 'WORKSPACE_DOMAIN_NOT_ALLOWED';
    throw error;
  }

  return {
    subject,
    email,
    givenName: payload.given_name || null,
    familyName: payload.family_name || null,
    displayName: payload.name || null,
    picture: payload.picture || null,
  };
}

export type AuthRole = {
  code: string;
  name: string;
  isSystemRole: boolean;
};

export type AuthEmployment = {
  businessUnitId: string | null;
  businessUnitCode: string | null;
  businessUnitName: string | null;
  positionId: string | null;
  positionCode: string | null;
  positionName: string | null;
  jobGradeId: string | null;
  gradeNumber: number | null;
  jobGradeName: string | null;
  jobLevelId: string | null;
  jobLevelCode: string | null;
  jobLevelName: string | null;
};

export type AuthUser = {
  id: string;
  employeeId: string | null;
  employeeCode: string | null;
  email: string | null;
  accountStatus: string | null;
  employeeStatus: string | null;
  profileStatus: string | null;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  displayName: string;
};

export type AuthSession = {
  hasWorkspaceSession: boolean;
  identityVerified: boolean;
  sessionKind: "USER" | "DEVELOPMENT_PREVIEW" | null;
  sessionId?: string;
  expiresAt?: string;
  canAccessWorkspace: boolean;
  requiresProfileSetup: boolean;
  onboardingStage: "PROFILE_SETUP" | "HR_REVIEW" | null;
  isSuperAdmin: boolean;
  user: AuthUser | null;
  employment: AuthEmployment | null;
  roles: AuthRole[];
  permissions: string[];
};

export type AuthConfig = {
  googleSsoConfigured: boolean;
  workspaceDomain: string | null;
  redirectUri: string | null;
  runtimeEnvironment: "development" | "production";
  missingConfiguration: string[];
};

export type InvitationPreview = {
  found: boolean;
  canActivate: boolean;
  code: string | null;
  message: string | null;
  httpStatus: number;
  invitation?: {
    publicId: string;
    employeeCode: string | null;
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    displayName: string;
    invitedEmailMasked: string;
    invitationStatus: string;
    expiresAt: string | null;
    employeeStatus: string | null;
    profileStatus: string | null;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const AUTH_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function requestJson<T>(
  path: string,
  label: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? {"Content-Type": "application/json"} : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `${label} API returned ${response.status}.`);
  }

  return payload.data;
}

export function fetchAuthConfig(signal?: AbortSignal) {
  return requestJson<AuthConfig>("/api/auth/config", "Authentication config", {signal});
}

export function fetchAuthSession(signal?: AbortSignal) {
  return requestJson<AuthSession>(
    "/api/auth/session",
    "Authentication session",
    {signal}
  );
}

export function fetchInvitationPreview(publicId: string, signal?: AbortSignal) {
  return requestJson<InvitationPreview>(
    `/api/auth/invitations/${encodeURIComponent(publicId)}`,
    "Invitation",
    {signal}
  );
}

export function buildGoogleSignInUrl({
  invitationPublicId,
  nextPath,
}: {
  invitationPublicId?: string | null;
  nextPath?: string | null;
} = {}) {
  const url = new URL("/api/auth/google/start", AUTH_API_URL);
  if (invitationPublicId) url.searchParams.set("invite", invitationPublicId);
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    url.searchParams.set("next", nextPath);
  }
  return url.toString();
}

export function startDevelopmentPreview() {
  return requestJson<AuthSession>(
    "/api/auth/development-session",
    "Development preview",
    {method: "POST"}
  );
}

export function logoutSession() {
  return requestJson<{loggedOut: boolean}>(
    "/api/auth/logout",
    "Logout",
    {method: "POST"}
  );
}

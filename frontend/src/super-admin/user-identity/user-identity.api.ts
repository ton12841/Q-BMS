import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type UserIdentityAccount = {
  id: string;
  employeeId: string | null;
  employeeCode: string | null;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;

  email: string | null;
  companyEmail: string | null;
  authProvider: string | null;
  googleLinked: boolean;
  accountStatus: string | null;
  employeeStatus: string | null;
  profileStatus: string | null;

  activatedAt: string | null;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  organization: {
    businessUnitCode: string | null;
    businessUnitName: string | null;
    positionCode: string | null;
    positionName: string | null;
    jobLevelCode: string | null;
    jobLevelName: string | null;
    gradeNumber: number | null;
    jobGradeName: string | null;
  };

  invitation: {
    status: string | null;
    sentAt: string | null;
    acceptedAt: string | null;
    expiresAt: string | null;
  };

  roles: string[];

  sessions: {
    active: number;
    lastSeenAt: string | null;
  };
};

export type UserIdentityOverview = {
  counts: {
    totalUsers: number;
    googleLinked: number;
    googleUnlinked: number;
    activeAccounts: number;
    onboardingAccounts: number;
    unlinkedEmployeeAccounts: number;
  };
  accounts: UserIdentityAccount[];
  mode: string;
  rules: {
    readOnly: boolean;
    employeeIsSourceOfTruth: boolean;
    googleIdentityChangesDisabled: boolean;
    accountStateChangesDisabled: boolean;
    roleChangesUseAccessControl: boolean;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchUserIdentityOverview(signal?: AbortSignal) {
  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/user-identity/overview`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<UserIdentityOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message ||
        `User & Identity Management API returned ${response.status}.`
    );
  }

  return payload.data;
}

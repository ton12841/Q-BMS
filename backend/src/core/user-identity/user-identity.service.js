import {
  getUserIdentityCounts,
  listUserIdentityAccounts,
} from './user-identity.repository.js';

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapAccount(row) {
  const displayName =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.nickname ||
    row.email ||
    `Q BMS User ${row.id}`;

  return {
    id: String(row.id),
    employeeId: row.employee_id ? String(row.employee_id) : null,
    employeeCode: row.employee_code || null,
    displayName,
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    nickname: row.nickname || null,

    email: row.email || null,
    companyEmail: row.company_email || null,
    authProvider: row.auth_provider || null,
    googleLinked: Boolean(row.google_subject),
    accountStatus: row.account_status || null,
    employeeStatus: row.employee_status || null,
    profileStatus: row.profile_status || null,

    activatedAt: iso(row.activated_at),
    firstLoginAt: iso(row.first_login_at),
    lastLoginAt: iso(row.last_login_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),

    organization: {
      businessUnitCode: row.business_unit_code || null,
      businessUnitName: row.business_unit_name || null,
      positionCode: row.position_code || null,
      positionName: row.position_name || null,
      jobLevelCode: row.job_level_code || null,
      jobLevelName: row.job_level_name || null,
      gradeNumber:
        row.grade_number === null || row.grade_number === undefined
          ? null
          : Number(row.grade_number),
      jobGradeName: row.job_grade_name || null,
    },

    invitation: {
      status: row.invitation_status || null,
      sentAt: iso(row.invitation_sent_at),
      acceptedAt: iso(row.invitation_accepted_at),
      expiresAt: iso(row.invitation_expires_at),
    },

    roles: Array.isArray(row.role_codes) ? row.role_codes : [],
    sessions: {
      active: Number(row.active_session_count || 0),
      lastSeenAt: iso(row.last_session_seen_at),
    },
  };
}

export async function getUserIdentityOverview() {
  const [counts, accounts] = await Promise.all([
    getUserIdentityCounts(),
    listUserIdentityAccounts(),
  ]);

  return {
    counts: {
      totalUsers: Number(counts.total_users || 0),
      googleLinked: Number(counts.google_linked || 0),
      googleUnlinked: Number(counts.google_unlinked || 0),
      activeAccounts: Number(counts.active_accounts || 0),
      onboardingAccounts: Number(counts.onboarding_accounts || 0),
      unlinkedEmployeeAccounts: Number(counts.unlinked_employee_accounts || 0),
    },
    accounts: accounts.map(mapAccount),
    mode: 'READ_ONLY_FOUNDATION',
    rules: {
      readOnly: true,
      employeeIsSourceOfTruth: true,
      googleIdentityChangesDisabled: true,
      accountStateChangesDisabled: true,
      roleChangesUseAccessControl: true,
    },
  };
}

export const CANONICAL_ONBOARDING_STATES = Object.freeze([
  'PRE_ONBOARDING',
  'IT_ACCOUNT_PENDING',
  'IT_ACCOUNT_READY',
  'INVITATION_SENT',
  'ONBOARDING',
  'PENDING_REVIEW',
  'ASSET_PENDING',
  'READY_TO_ACTIVATE',
  'ACTIVE',
]);

function upper(value) {
  return String(value || '').trim().toUpperCase();
}

export function resolveOnboardingState(snapshot = {}) {
  const employeeStatus = upper(snapshot.employeeStatus ?? snapshot.employee_status);
  const profileStatus = upper(snapshot.profileStatus ?? snapshot.profile_status);
  const accountSetupStatus = upper(snapshot.accountSetupStatus ?? snapshot.account_setup_status);
  const invitationStatus = upper(snapshot.invitationStatus ?? snapshot.invitation_status);
  const accountStatus = upper(snapshot.accountStatus ?? snapshot.qbms_account_status ?? snapshot.account_status);
  const caseStatus = upper(snapshot.caseStatus ?? snapshot.onboarding_case_status ?? snapshot.case_status);
  const googleLinked = Boolean(
    snapshot.googleLinked ?? snapshot.google_linked ?? snapshot.googleSubject ?? snapshot.google_subject
  );

  if (
    employeeStatus === 'ACTIVE' ||
    (caseStatus === 'COMPLETED' && accountStatus === 'ACTIVE' && profileStatus === 'COMPLETE')
  ) {
    return 'ACTIVE';
  }

  if (caseStatus === 'ASSET_COMPLETED') {
    return 'READY_TO_ACTIVATE';
  }

  if (caseStatus === 'HR_APPROVED') {
    return 'ASSET_PENDING';
  }

  if (
    caseStatus === 'SUBMITTED' ||
    profileStatus === 'SUBMITTED'
  ) {
    return 'PENDING_REVIEW';
  }

  if (
    accountStatus === 'ONBOARDING' ||
    googleLinked ||
    invitationStatus === 'ACCEPTED' ||
    profileStatus === 'IN_PROGRESS'
  ) {
    return 'ONBOARDING';
  }

  if (['QUEUED', 'SENT'].includes(invitationStatus)) {
    return 'INVITATION_SENT';
  }

  if (
    accountSetupStatus === 'COMPLETED' ||
    invitationStatus === 'DRAFT'
  ) {
    return 'IT_ACCOUNT_READY';
  }

  if (['PENDING', 'IN_PROGRESS'].includes(accountSetupStatus)) {
    return 'IT_ACCOUNT_PENDING';
  }

  return 'PRE_ONBOARDING';
}

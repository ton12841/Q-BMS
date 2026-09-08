import assert from 'node:assert/strict';
import { resolveOnboardingState } from '../src/core/onboarding-state/onboarding-state.service.js';

export async function run() {
  const cases = [
    [{ account_setup_status: 'PENDING' }, 'IT_ACCOUNT_PENDING'],
    [{ account_setup_status: 'IN_PROGRESS' }, 'IT_ACCOUNT_PENDING'],
    [{ account_setup_status: 'COMPLETED' }, 'IT_ACCOUNT_READY'],
    [{ invitation_status: 'DRAFT' }, 'IT_ACCOUNT_READY'],
    [{ invitation_status: 'QUEUED' }, 'INVITATION_SENT'],
    [{ invitation_status: 'SENT' }, 'INVITATION_SENT'],
    [{ invitation_status: 'ACCEPTED' }, 'ONBOARDING'],
    [{ profile_status: 'IN_PROGRESS' }, 'ONBOARDING'],
    [{ profile_status: 'SUBMITTED' }, 'PENDING_REVIEW'],
    [{ case_status: 'HR_APPROVED' }, 'ASSET_PENDING'],
    [{ case_status: 'ASSET_COMPLETED' }, 'READY_TO_ACTIVATE'],
    [{ employee_status: 'ACTIVE' }, 'ACTIVE'],
    [{}, 'PRE_ONBOARDING'],
  ];

  for (const [snapshot, expected] of cases) {
    assert.equal(resolveOnboardingState(snapshot), expected, JSON.stringify(snapshot));
  }
}

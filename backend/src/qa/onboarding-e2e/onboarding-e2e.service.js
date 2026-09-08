import { getOnboardingQaSnapshot, listOnboardingQaEmployees } from './onboarding-e2e.repository.js';

const EMPLOYEE_SELF_TASKS = [
  'PERSONAL_INFORMATION',
  'EMERGENCY_CONTACT',
  'BANK_INFORMATION',
  'PERSONAL_DOCUMENTS',
  'COMPANY_POLICY',
];

const LINKS = {
  1: '/employees',
  2: '/it-admin/account-setup',
  3: '/hrm/invitations',
  4: '/hrm/invitations',
  5: '/onboarding/profile',
  6: '/hrm/onboarding-review',
  7: '/hrm/asset-gate',
  8: '/hrm/activation',
  9: '/workspace',
};

function taskMap(tasks = []) {
  return new Map(tasks.map((task) => [task.task_code, task]));
}

function isCompleted(task) {
  return String(task?.task_status || '').toUpperCase() === 'COMPLETED';
}

function buildStepDefinitions(raw) {
  const { employee, accountSetup, invitation, onboardingCase, tasks, latestReview, latestAssetGateEvent, latestActivationEvent } = raw;
  const byCode = taskMap(tasks);

  const assignmentDone = Boolean(employee.assignment_id && employee.business_unit_id && employee.position_id && employee.job_grade_id);
  const step1 = Boolean(employee.id && employee.employee_code && assignmentDone);
  const step2 = String(accountSetup?.request_status || '').toUpperCase() === 'COMPLETED' && Boolean(employee.company_email);
  const invitationStatus = String(invitation?.invitation_status || '').toUpperCase();
  const step3 = ['QUEUED', 'SENT', 'ACCEPTED'].includes(invitationStatus);
  const step4 = invitationStatus === 'ACCEPTED' && Boolean(employee.google_subject) && Boolean(employee.user_id);
  const employeeTasksDone = EMPLOYEE_SELF_TASKS.every((code) => isCompleted(byCode.get(code)));
  const step5 = employeeTasksDone && ['SUBMITTED', 'COMPLETE'].includes(String(employee.profile_status || '').toUpperCase());
  const caseStatus = String(onboardingCase?.case_status || '').toUpperCase();
  const step6 = isCompleted(byCode.get('HR_REVIEW')) && ['HR_APPROVED', 'ASSET_COMPLETED', 'COMPLETED'].includes(caseStatus) && String(latestReview?.review_action || '').toUpperCase() === 'APPROVED';
  const gateEvent = String(latestAssetGateEvent?.event_type || '').toUpperCase();
  const step7 = isCompleted(byCode.get('ASSET_ASSIGNMENT')) && ['ASSET_COMPLETED', 'COMPLETED'].includes(caseStatus) && ['ASSETS_ASSIGNED', 'NO_ASSET_REQUIRED'].includes(gateEvent);
  const step8 = isCompleted(byCode.get('ACTIVATION')) && caseStatus === 'COMPLETED' && String(employee.employee_status || '').toUpperCase() === 'ACTIVE' && String(employee.profile_status || '').toUpperCase() === 'COMPLETE' && String(employee.user_account_status || '').toUpperCase() === 'ACTIVE' && String(latestActivationEvent?.event_type || '').toUpperCase() === 'ACTIVATED';
  const step9 = step8 && Boolean(employee.user_id) && Boolean(employee.google_subject);

  const base = [
    { number: 1, code: 'HR_CREATE', title: 'HR Create New Employee', done: step1, evidence: step1 ? `Employee ${employee.employee_code} + primary assignment created` : 'Employee record or primary assignment is incomplete' },
    { number: 2, code: 'IT_ACCOUNT_SETUP', title: 'IT Account Setup Workflow', done: step2, evidence: step2 ? `Company Email: ${employee.company_email}` : `IT Setup: ${accountSetup?.request_status || 'NOT_STARTED'}` },
    { number: 3, code: 'SEND_INVITATION', title: 'Send Invitation', done: step3, evidence: `Invitation: ${invitationStatus || 'NOT_STARTED'}` },
    { number: 4, code: 'GOOGLE_IDENTITY', title: 'Google Login / Identity Linking', done: step4, evidence: step4 ? 'Google identity linked to Q BMS user' : `Identity linked: ${employee.google_subject ? 'YES' : 'NO'}` },
    { number: 5, code: 'SELF_ONBOARDING', title: 'Self-Onboarding', done: step5, evidence: step5 ? 'Employee-owned onboarding tasks submitted' : `Profile: ${employee.profile_status || 'NOT_STARTED'} · ${EMPLOYEE_SELF_TASKS.filter((code) => isCompleted(byCode.get(code))).length}/${EMPLOYEE_SELF_TASKS.length} employee tasks` },
    { number: 6, code: 'HR_REVIEW', title: 'HR Review', done: step6, evidence: `Review: ${latestReview?.review_action || 'NOT_STARTED'} · Case: ${caseStatus || 'NOT_STARTED'}` },
    { number: 7, code: 'ASSET_GATE', title: 'Asset Gate', done: step7, evidence: `Asset Gate: ${gateEvent || 'NOT_STARTED'} · Active assets: ${raw.activeAssetCount}` },
    { number: 8, code: 'ACTIVATE', title: 'Activate', done: step8, evidence: step8 ? 'Employee + Q BMS User ACTIVE' : `Employee: ${employee.employee_status} · User: ${employee.user_account_status || 'NOT_LINKED'}` },
    { number: 9, code: 'EMPLOYEE_WORKSPACE', title: 'Employee Workspace', done: step9, evidence: step9 ? 'Workspace-ready identity is ACTIVE' : 'Workspace unlocks after successful activation' },
  ];

  let previousDone = true;
  return base.map((step) => {
    const status = step.done ? 'DONE' : previousDone ? 'CURRENT' : 'WAITING';
    previousDone = previousDone && step.done;
    return { ...step, status, href: LINKS[step.number] };
  });
}

function buildBlockers(raw, steps) {
  const blockers = [];
  const { employee, accountSetup, invitation, onboardingCase } = raw;
  if (!employee.assignment_id) blockers.push('Primary employment assignment is missing.');
  if (!accountSetup) blockers.push('IT Account Setup request is missing.');
  if (['CANCELLED'].includes(String(accountSetup?.request_status || '').toUpperCase())) blockers.push('IT Account Setup request is cancelled.');
  if (['EXPIRED', 'REVOKED'].includes(String(invitation?.invitation_status || '').toUpperCase())) blockers.push(`Invitation is ${invitation.invitation_status}. Queue a new invitation before continuing.`);
  if (employee.user_account_status && ['SUSPENDED', 'INACTIVE'].includes(String(employee.user_account_status).toUpperCase())) blockers.push(`Q BMS user account is ${employee.user_account_status}.`);
  if (onboardingCase && String(onboardingCase.case_status || '').toUpperCase() === 'CHANGES_REQUESTED') blockers.push('HR requested changes. Employee must update and resubmit Self-Onboarding.');
  const current = steps.find((step) => step.status === 'CURRENT');
  return { blockers, currentStep: current || null };
}

export async function listOnboardingE2EQa() {
  return listOnboardingQaEmployees();
}

export async function getOnboardingE2EQa(employeeId) {
  const id = Number(employeeId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('Invalid Employee ID.');
    error.statusCode = 400;
    throw error;
  }
  const raw = await getOnboardingQaSnapshot(id);
  if (!raw) return null;
  const steps = buildStepDefinitions(raw);
  const { blockers, currentStep } = buildBlockers(raw, steps);
  return {
    employee: raw.employee,
    accountSetup: raw.accountSetup,
    invitation: raw.invitation,
    onboardingCase: raw.onboardingCase,
    tasks: raw.tasks,
    latestReview: raw.latestReview,
    latestAssetGateEvent: raw.latestAssetGateEvent,
    activeAssetCount: raw.activeAssetCount,
    latestActivationEvent: raw.latestActivationEvent,
    steps,
    blockers,
    currentStep,
    completedSteps: steps.filter((step) => step.done).length,
    e2eComplete: steps.every((step) => step.done),
  };
}

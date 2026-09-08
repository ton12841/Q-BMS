import { getEmployeeOnboardingSnapshot } from '../../../modules/employee/onboarding/employee-onboarding.service.js';
import {
  approveOnboardingReview,
  getOnboardingReviewCase,
  listOnboardingReviewCases,
  listOnboardingReviewHistory,
  requestOnboardingChanges,
} from './onboarding-review.repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeEmployeeId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('A valid Employee ID is required.');
  return id;
}

function normalizeNote(value, { required = false } = {}) {
  const note = String(value ?? '').trim();
  if (required && !note) throw badRequest('A review note is required when requesting changes.');
  if (note.length > 4000) throw badRequest('Review note must be 4,000 characters or fewer.');
  return note || null;
}

export function listReviews({ locale }) {
  return listOnboardingReviewCases({ locale });
}

export async function getReviewDetail({ employeeId, locale }) {
  const id = normalizeEmployeeId(employeeId);
  const reviewCase = await getOnboardingReviewCase(id);
  if (!reviewCase) {
    const error = new Error('Onboarding review case was not found.');
    error.statusCode = 404;
    throw error;
  }

  const [onboarding, history] = await Promise.all([
    getEmployeeOnboardingSnapshot(id, locale),
    listOnboardingReviewHistory(id),
  ]);

  return { review_case: reviewCase, onboarding, history };
}

export async function requestChanges({ employeeId, payload, auth, locale }) {
  const id = normalizeEmployeeId(employeeId);
  await requestOnboardingChanges({
    employeeId: id,
    reviewerUserId: auth?.user?.id || null,
    note: normalizeNote(payload?.note, { required: true }),
  });
  return getReviewDetail({ employeeId: id, locale });
}

export async function approveReview({ employeeId, payload, auth, locale }) {
  const id = normalizeEmployeeId(employeeId);
  await approveOnboardingReview({
    employeeId: id,
    reviewerUserId: auth?.user?.id || null,
    note: normalizeNote(payload?.note),
  });
  return getReviewDetail({ employeeId: id, locale });
}

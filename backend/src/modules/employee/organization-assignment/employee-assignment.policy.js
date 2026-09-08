const CHANGE_TYPES = new Set([
  'INITIAL',
  'TRANSFER',
  'PROMOTION',
  'LATERAL_MOVE',
  'CORRECTION',
]);

function domainError(message, code = 'EMPLOYEE_ASSIGNMENT_VALIDATION', statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export function normalizeAssignmentId(value, label = 'ID') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw domainError(`${label} is invalid.`);
  }
  return id;
}

export function localTodayYmd(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeAssignmentDate(value, {
  label = 'Effective Date',
  required = true,
  allowFuture = false,
  now = new Date(),
} = {}) {
  const raw = String(value || '').trim();

  if (!raw) {
    if (!required) return null;
    throw domainError(`${label} is required.`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw domainError(`${label} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw domainError(`${label} is invalid.`);
  }

  if (!allowFuture && raw > localTodayYmd(now)) {
    throw domainError(`${label} cannot be in the future.`);
  }

  return raw;
}

export function normalizeAssignmentChangeType(value, { initial = false } = {}) {
  if (initial) return 'INITIAL';

  const normalized = String(value || '').trim().toUpperCase();
  if (!CHANGE_TYPES.has(normalized) || normalized === 'INITIAL') {
    throw domainError(
      'Change Type must be TRANSFER, PROMOTION, LATERAL_MOVE or CORRECTION.'
    );
  }
  return normalized;
}

export function previousDateYmd(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function assignmentDiffers(current, next) {
  if (!current) return true;

  return (
    Number(current.business_unit_id) !== Number(next.businessUnitId) ||
    Number(current.position_id) !== Number(next.positionId) ||
    Number(current.job_grade_id) !== Number(next.jobGradeId)
  );
}

export function assertAssignmentTransitionDate(current, effectiveFrom) {
  if (!current?.effective_from) return;

  const currentStart = String(current.effective_from).slice(0, 10);
  if (effectiveFrom <= currentStart) {
    throw domainError(
      `New assignment Effective Date must be later than the current assignment start date (${currentStart}).`,
      'EMPLOYEE_ASSIGNMENT_DATE_CONFLICT',
      409
    );
  }
}

export function assertReportingLinesCanClose(lines = [], effectiveFrom) {
  const conflict = lines.find((line) => {
    const lineStart = line.effective_from
      ? String(line.effective_from).slice(0, 10)
      : null;
    return lineStart && lineStart >= effectiveFrom;
  });

  if (conflict) {
    throw domainError(
      `Assignment Effective Date must be later than active Reporting Line start date ${String(conflict.effective_from).slice(0, 10)}.`,
      'EMPLOYEE_ASSIGNMENT_REPORTING_DATE_CONFLICT',
      409
    );
  }
}

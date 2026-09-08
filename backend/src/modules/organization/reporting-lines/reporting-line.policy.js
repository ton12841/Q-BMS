function error(message, code = 'REPORTING_LINE_VALIDATION', statusCode = 400) {
  const value = new Error(message);
  value.code = code;
  value.statusCode = statusCode;
  return value;
}

export function normalizeReportingAssignmentId(value, label = 'Assignment ID') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw error(`${label} is invalid.`);
  }
  return id;
}

export function normalizeReportingRelationshipType(value) {
  const type = String(value || 'PRIMARY').trim().toUpperCase();
  if (!['PRIMARY', 'DOTTED'].includes(type)) {
    throw error('Relationship Type must be PRIMARY or DOTTED.');
  }
  return type;
}

export function localTodayYmd(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeReportingDate(value, {
  label = 'Effective Date',
  required = true,
  allowFuture = false,
  now = new Date(),
} = {}) {
  const raw = String(value || '').trim();
  if (!raw) {
    if (!required) return null;
    throw error(`${label} is required.`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw error(`${label} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw error(`${label} is invalid.`);
  }

  if (!allowFuture && raw > localTodayYmd(now)) {
    throw error(`${label} cannot be in the future in this foundation.`);
  }

  return raw;
}

export function assertReportingDateOrder(effectiveFrom, effectiveTo) {
  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    throw error('Effective To cannot be earlier than Effective From.');
  }
}

export function wouldCreateReportingCycle({
  employeeAssignmentId,
  reportsToAssignmentId,
  edges = [],
}) {
  const child = String(employeeAssignmentId);
  const manager = String(reportsToAssignmentId);
  if (child === manager) return true;

  const adjacency = new Map();
  for (const edge of edges) {
    const from = String(edge.employee_assignment_id ?? edge.employeeAssignmentId);
    const to = String(edge.reports_to_assignment_id ?? edge.reportsToAssignmentId);
    if (!from || !to) continue;
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push(to);
  }

  const queue = [manager];
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (current === child) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const next of adjacency.get(current) || []) {
      if (!visited.has(next)) queue.push(next);
    }
  }

  return false;
}

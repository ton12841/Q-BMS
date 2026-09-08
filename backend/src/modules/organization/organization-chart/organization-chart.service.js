import {
  listOrganizationChartAssignments,
  listOrganizationChartEdges,
} from './organization-chart.repository.js';
import { buildOrganizationChartTopology } from './organization-chart.policy.js';

function displayName(row) {
  const full = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return row.nickname ? `${full || row.nickname} (${row.nickname})` : (full || row.employee_code || 'Employee');
}

function initials(row) {
  const first = String(row.first_name || '').trim().charAt(0);
  const last = String(row.last_name || '').trim().charAt(0);
  return `${first}${last}`.toUpperCase() || String(row.employee_code || '?').charAt(0).toUpperCase();
}

export async function getOrganizationChart({ locale = 'en' } = {}) {
  const [assignmentRows, edgeRows] = await Promise.all([
    listOrganizationChartAssignments({ locale }),
    listOrganizationChartEdges(),
  ]);

  const activeIds = new Set(assignmentRows.map((row) => String(row.assignment_id)));

  const nodes = assignmentRows.map((row) => ({
    assignmentId: String(row.assignment_id),
    employeeId: String(row.employee_id),
    employeeCode: row.employee_code || null,
    displayName: displayName(row),
    firstName: row.first_name,
    lastName: row.last_name,
    nickname: row.nickname || null,
    initials: initials(row),
    workLocation: row.work_location || null,
    businessUnit: {
      id: String(row.business_unit_id),
      code: row.business_unit_code,
      name: row.business_unit_name,
    },
    position: {
      id: String(row.position_id),
      code: row.position_code,
      name: row.position_name,
    },
    jobGrade: {
      id: String(row.job_grade_id),
      gradeNumber: Number(row.grade_number),
      name: row.job_grade_name,
    },
    jobLevel: {
      id: String(row.job_level_id),
      code: row.job_level_code,
      name: row.job_level_name,
    },
    effectiveFrom: row.effective_from ? String(row.effective_from).slice(0, 10) : null,
  }));

  const edges = edgeRows
    .filter((row) =>
      activeIds.has(String(row.employee_assignment_id)) &&
      activeIds.has(String(row.reports_to_assignment_id))
    )
    .map((row) => ({
      id: String(row.id),
      employeeAssignmentId: String(row.employee_assignment_id),
      reportsToAssignmentId: String(row.reports_to_assignment_id),
      relationshipType: row.relationship_type,
      effectiveFrom: row.effective_from ? String(row.effective_from).slice(0, 10) : null,
    }));

  const topology = buildOrganizationChartTopology(nodes, edges);

  const businessUnitMap = new Map();
  for (const node of nodes) {
    businessUnitMap.set(node.businessUnit.id, node.businessUnit);
  }

  return {
    generatedFrom: 'EMPLOYEE_ASSIGNMENT_AND_REPORTING_LINES',
    readOnly: true,
    departmentStatus: 'HOLD',
    nodes,
    edges,
    businessUnits: [...businessUnitMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    counts: {
      employees: nodes.length,
      primaryLines: edges.filter((edge) => edge.relationshipType === 'PRIMARY').length,
      dottedLines: edges.filter((edge) => edge.relationshipType === 'DOTTED').length,
      roots: topology.rootAssignmentIds.length,
      withoutPrimaryManager: topology.rootAssignmentIds.length,
    },
    integrity: {
      orphanEdgeCount: topology.orphanEdgeCount,
      duplicatePrimaryCount: topology.duplicatePrimaryCount,
    },
  };
}

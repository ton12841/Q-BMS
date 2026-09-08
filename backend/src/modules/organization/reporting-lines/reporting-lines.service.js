import {
  getActiveReportingPair,
  getCurrentAssignmentById,
  getCurrentPrimaryReportingLine,
  getReportingLineById,
  getReportingLineForUpdate,
  insertReportingLineRecord,
  endReportingLineRecord,
  listActiveReportingEdges,
  listCurrentEmployeeAssignments,
  listReportingLines,
  recordReportingLineAudit,
  syncLegacyPrimaryManager,
  withReportingLineTransaction,
} from './reporting-lines.repository.js';
import {
  assertReportingDateOrder,
  localTodayYmd,
  normalizeReportingAssignmentId,
  normalizeReportingDate,
  normalizeReportingRelationshipType,
  wouldCreateReportingCycle,
} from './reporting-line.policy.js';

function domainError(message, code, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function displayName(row, prefix = '') {
  const nickname = row[`${prefix}nickname`];
  const first = row[`${prefix}first_name`];
  const last = row[`${prefix}last_name`];
  const full = [first, last].filter(Boolean).join(' ').trim();
  return nickname ? `${full || nickname} (${nickname})` : (full || row[`${prefix}employee_code`] || 'Employee');
}

function mapAssignment(row) {
  return {
    assignmentId: String(row.assignment_id),
    employeeId: String(row.employee_id),
    employeeCode: row.employee_code || null,
    displayName: displayName(row),
    firstName: row.first_name || null,
    lastName: row.last_name || null,
    nickname: row.nickname || null,
    employeeStatus: row.employee_status || null,
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
      id: row.job_level_id ? String(row.job_level_id) : null,
      code: row.job_level_code,
      name: row.job_level_name,
    },
    effectiveFrom: row.effective_from || null,
  };
}

function mapLine(row) {
  return {
    id: String(row.id),
    employeeAssignmentId: String(row.employee_assignment_id),
    reportsToAssignmentId: String(row.reports_to_assignment_id),
    relationshipType: row.relationship_type,
    status: row.status,
    effectiveFrom: row.effective_from || null,
    effectiveTo: row.effective_to || null,
    isCurrent: row.status === 'ACTIVE' && !row.effective_to,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    employee: {
      employeeId: String(row.employee_id),
      employeeCode: row.employee_code || null,
      displayName: displayName(row),
      businessUnitCode: row.business_unit_code,
      businessUnitName: row.business_unit_name,
      positionCode: row.position_code,
      positionName: row.position_name,
      gradeNumber: Number(row.grade_number),
      jobGradeName: row.job_grade_name,
      jobLevelCode: row.job_level_code,
      jobLevelName: row.job_level_name,
    },
    manager: {
      employeeId: String(row.manager_employee_id),
      employeeCode: row.manager_employee_code || null,
      displayName: displayName(row, 'manager_'),
      businessUnitCode: row.manager_business_unit_code,
      businessUnitName: row.manager_business_unit_name,
      positionCode: row.manager_position_code,
      positionName: row.manager_position_name,
      gradeNumber: Number(row.manager_grade_number),
      jobGradeName: row.manager_job_grade_name,
      jobLevelCode: row.manager_job_level_code,
      jobLevelName: row.manager_job_level_name,
    },
  };
}

export async function getReportingLinesOverview({ locale = 'en' } = {}) {
  const [assignmentRows, lineRows] = await Promise.all([
    listCurrentEmployeeAssignments({ locale }),
    listReportingLines({ locale }),
  ]);

  const assignments = assignmentRows.map(mapAssignment);
  const lines = lineRows.map(mapLine);
  const currentLines = lines.filter((line) => line.isCurrent);
  const primaryByAssignment = new Map(
    currentLines
      .filter((line) => line.relationshipType === 'PRIMARY')
      .map((line) => [line.employeeAssignmentId, line])
  );

  return {
    counts: {
      activeAssignments: assignments.length,
      activePrimary: currentLines.filter((line) => line.relationshipType === 'PRIMARY').length,
      activeDotted: currentLines.filter((line) => line.relationshipType === 'DOTTED').length,
      withoutPrimary: assignments.filter((assignment) => !primaryByAssignment.has(assignment.assignmentId)).length,
      history: lines.filter((line) => !line.isCurrent).length,
    },
    assignments,
    lines,
    rules: {
      managerSource: 'EMPLOYEE_ASSIGNMENT',
      primaryManagerLimit: 1,
      dottedManagerLimit: null,
      futureEffectiveDates: false,
      cycleDetection: true,
      hardDelete: false,
      departmentStatus: 'HOLD',
    },
  };
}

export async function createOrChangeReportingLine({ payload = {}, actorUserId = null, locale = 'en' }) {
  const employeeAssignmentId = normalizeReportingAssignmentId(
    payload.employee_assignment_id ?? payload.employeeAssignmentId,
    'Employee Assignment ID'
  );
  const reportsToAssignmentId = normalizeReportingAssignmentId(
    payload.reports_to_assignment_id ?? payload.reportsToAssignmentId,
    'Manager Assignment ID'
  );
  const relationshipType = normalizeReportingRelationshipType(
    payload.relationship_type ?? payload.relationshipType
  );
  const effectiveFrom = normalizeReportingDate(
    payload.effective_from ?? payload.effectiveFrom ?? localTodayYmd(),
    { label: 'Effective From' }
  );

  return withReportingLineTransaction(async (client) => {
    const [employeeAssignment, managerAssignment] = await Promise.all([
      getCurrentAssignmentById(employeeAssignmentId, client),
      getCurrentAssignmentById(reportsToAssignmentId, client),
    ]);

    if (!employeeAssignment) {
      throw domainError('Employee Assignment is not active or does not exist.', 'REPORTING_LINE_EMPLOYEE_ASSIGNMENT_NOT_FOUND', 404);
    }
    if (!managerAssignment) {
      throw domainError('Manager Assignment is not active or does not exist.', 'REPORTING_LINE_MANAGER_ASSIGNMENT_NOT_FOUND', 404);
    }
    if (String(employeeAssignment.employee_id) === String(managerAssignment.employee_id)) {
      throw domainError('An Employee cannot report to themselves.', 'REPORTING_LINE_SELF_REFERENCE');
    }

    const existingPair = await getActiveReportingPair({
      employeeAssignmentId,
      reportsToAssignmentId,
      executor: client,
    });
    if (existingPair) {
      throw domainError(
        'This Employee already has an active reporting relationship with the selected Manager. End the current relationship before changing its type.',
        'REPORTING_LINE_DUPLICATE',
        409
      );
    }

    const edges = await listActiveReportingEdges(client);
    if (wouldCreateReportingCycle({ employeeAssignmentId, reportsToAssignmentId, edges })) {
      throw domainError(
        'This relationship would create a reporting cycle. Choose another Manager.',
        'REPORTING_LINE_CYCLE',
        409
      );
    }

    let previousPrimary = null;
    if (relationshipType === 'PRIMARY') {
      previousPrimary = await getCurrentPrimaryReportingLine(employeeAssignmentId, client);
      if (previousPrimary) {
        assertReportingDateOrder(previousPrimary.effective_from, effectiveFrom);
        await endReportingLineRecord({
          id: previousPrimary.id,
          effectiveTo: effectiveFrom,
          executor: client,
        });
      }
    }

    const created = await insertReportingLineRecord({
      employeeAssignmentId,
      reportsToAssignmentId,
      relationshipType,
      effectiveFrom,
      executor: client,
    });

    if (relationshipType === 'PRIMARY') {
      await syncLegacyPrimaryManager({
        employeeAssignmentId,
        reportsToAssignmentId,
        executor: client,
      });
    }

    await recordReportingLineAudit({
      actorUserId,
      action: relationshipType === 'PRIMARY' && previousPrimary
        ? 'ORGANIZATION.REPORTING_LINE_PRIMARY_CHANGED'
        : 'ORGANIZATION.REPORTING_LINE_CREATED',
      reportingLineId: created.id,
      metadata: {
        employee_assignment_id: employeeAssignmentId,
        reports_to_assignment_id: reportsToAssignmentId,
        relationship_type: relationshipType,
        effective_from: effectiveFrom,
        previous_primary_reporting_line_id: previousPrimary?.id || null,
        previous_primary_manager_assignment_id: previousPrimary?.reports_to_assignment_id || null,
      },
      executor: client,
    });

    const detail = await getReportingLineById({ id: created.id, locale, executor: client });
    return mapLine(detail);
  });
}

export async function endReportingLine({ id, payload = {}, actorUserId = null, locale = 'en' }) {
  const reportingLineId = normalizeReportingAssignmentId(id, 'Reporting Line ID');
  const effectiveTo = normalizeReportingDate(
    payload.effective_to ?? payload.effectiveTo ?? localTodayYmd(),
    { label: 'Effective To' }
  );

  return withReportingLineTransaction(async (client) => {
    const current = await getReportingLineForUpdate(reportingLineId, client);
    if (!current) {
      throw domainError('Reporting Line not found.', 'REPORTING_LINE_NOT_FOUND', 404);
    }
    if (current.status !== 'ACTIVE' || current.effective_to) {
      throw domainError('Reporting Line is already inactive.', 'REPORTING_LINE_ALREADY_ENDED', 409);
    }

    assertReportingDateOrder(current.effective_from, effectiveTo);

    await endReportingLineRecord({ id: reportingLineId, effectiveTo, executor: client });

    if (current.relationship_type === 'PRIMARY') {
      await syncLegacyPrimaryManager({
        employeeAssignmentId: current.employee_assignment_id,
        reportsToAssignmentId: null,
        executor: client,
      });
    }

    await recordReportingLineAudit({
      actorUserId,
      action: 'ORGANIZATION.REPORTING_LINE_ENDED',
      reportingLineId,
      metadata: {
        employee_assignment_id: current.employee_assignment_id,
        reports_to_assignment_id: current.reports_to_assignment_id,
        relationship_type: current.relationship_type,
        effective_from: current.effective_from,
        effective_to: effectiveTo,
      },
      executor: client,
    });

    const detail = await getReportingLineById({ id: reportingLineId, locale, executor: client });
    return mapLine(detail);
  });
}

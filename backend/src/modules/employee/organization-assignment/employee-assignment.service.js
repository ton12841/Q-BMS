import {
  closeAssignment,
  closeReportingLines,
  getActiveAssignmentById,
  getCurrentAssignmentForUpdate,
  getEmployeeIdentity,
  insertAssignment,
  insertReportingLine,
  listActiveIncomingLines,
  listActiveOutgoingLines,
  listActiveReportingEdges,
  listEmployeeAssignments,
  listManagerCandidates,
  lockEmployee,
  recordAssignmentAudit,
  syncLegacyOrganizationFields,
  validateAssignmentChoice,
  withAssignmentTransaction,
} from './employee-assignment.repository.js';
import {
  assertAssignmentTransitionDate,
  assertReportingLinesCanClose,
  assignmentDiffers,
  normalizeAssignmentChangeType,
  normalizeAssignmentDate,
  normalizeAssignmentId,
  previousDateYmd,
} from './employee-assignment.policy.js';
import { wouldCreateReportingCycle } from '../../organization/reporting-lines/reporting-line.policy.js';

function domainError(message, code, statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function nullableText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function displayName(row, prefix = '') {
  const first = row[`${prefix}first_name`];
  const last = row[`${prefix}last_name`];
  const nickname = row[`${prefix}nickname`];
  const full = [first, last].filter(Boolean).join(' ').trim();
  return nickname ? `${full || nickname} (${nickname})` : (full || row[`${prefix}employee_code`] || 'Employee');
}

function mapManager(row) {
  if (!row.manager_assignment_id) return null;

  return {
    assignmentId: String(row.manager_assignment_id),
    employeeId: String(row.manager_employee_id),
    employeeCode: row.manager_employee_code || null,
    displayName: displayName(row, 'manager_'),
    businessUnitCode: row.manager_business_unit_code || null,
    businessUnitName: row.manager_business_unit_name || null,
    positionCode: row.manager_position_code || null,
    positionName: row.manager_position_name || null,
  };
}

function mapAssignment(row) {
  return {
    assignmentId: String(row.assignment_id),
    employeeId: String(row.employee_id),
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
    status: row.assignment_status,
    effectiveFrom: row.effective_from ? String(row.effective_from).slice(0, 10) : null,
    effectiveTo: row.effective_to ? String(row.effective_to).slice(0, 10) : null,
    changeType: row.change_type || 'LEGACY',
    changeReason: row.change_reason || null,
    changeNote: row.change_note || null,
    createdByUserId: row.created_by_user_id ? String(row.created_by_user_id) : null,
    createdByEmail: row.created_by_email || null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    manager: mapManager(row),
  };
}

function mapCandidate(row) {
  return {
    assignmentId: String(row.assignment_id),
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
  };
}

async function assertOrganizationChoice(choice, executor) {
  const result = await validateAssignmentChoice({
    ...choice,
    executor,
  });

  if (!result.business_unit_exists) {
    throw domainError('Selected Business Unit is not available.');
  }
  if (!result.position_exists) {
    throw domainError('Selected Position is not available.');
  }
  if (!result.job_grade_exists) {
    throw domainError('Selected Job Grade is not available.');
  }
  if (!result.position_grade_allowed) {
    throw domainError('Selected Job Grade is not allowed for this Position.');
  }
}

function normalizeChoice(payload = {}) {
  return {
    businessUnitId: normalizeAssignmentId(payload.business_unit_id, 'Business Unit'),
    positionId: normalizeAssignmentId(payload.position_id, 'Position'),
    jobGradeId: normalizeAssignmentId(payload.job_grade_id, 'Job Grade'),
  };
}

export async function getEmployeeAssignmentOverview({
  employeeId,
  locale = 'en',
}) {
  const id = normalizeAssignmentId(employeeId, 'Employee ID');

  const [employee, assignmentRows, managerRows] = await Promise.all([
    getEmployeeIdentity(id),
    listEmployeeAssignments({ employeeId: id, locale }),
    listManagerCandidates({ employeeId: id, locale }),
  ]);

  if (!employee) {
    throw domainError('Employee not found.', 'EMPLOYEE_NOT_FOUND', 404);
  }

  const assignments = assignmentRows.map(mapAssignment);
  const current = assignments.find(
    (item) => item.status === 'ACTIVE' && !item.effectiveTo
  ) || null;

  return {
    employee: {
      id: String(employee.id),
      employeeCode: employee.employee_code,
      companyEmail: employee.company_email || null,
      firstName: employee.first_name,
      lastName: employee.last_name,
      nickname: employee.nickname || null,
      displayName: displayName(employee),
      employeeStatus: employee.employee_status,
      employmentType: employee.employment_type || null,
      startDate: employee.start_date ? String(employee.start_date).slice(0, 10) : null,
      workLocation: employee.work_location || null,
    },
    current,
    history: assignments,
    managerCandidates: managerRows.map(mapCandidate),
    rules: {
      departmentStatus: 'HOLD',
      jobLevelDerivedFromGrade: true,
      activeAssignmentHistoryImmutable: true,
      futureAssignmentScheduling: false,
      managerSource: 'EMPLOYEE_REPORTING_LINES',
      reportingContinuityOnTransition: true,
      dottedReportingManagedSeparately: true,
    },
  };
}

export async function transitionEmployeeAssignment({
  employeeId,
  payload = {},
  actorUserId = null,
  locale = 'en',
}) {
  const id = normalizeAssignmentId(employeeId, 'Employee ID');
  const choice = normalizeChoice(payload);
  const effectiveFrom = normalizeAssignmentDate(payload.effective_from, {
    allowFuture: false,
  });
  const changeReason = nullableText(payload.change_reason);
  const changeNote = nullableText(payload.change_note);
  const managerWasExplicit =
    Object.prototype.hasOwnProperty.call(payload, 'primary_manager_assignment_id');

  const requestedManagerId =
    payload.primary_manager_assignment_id === null ||
    payload.primary_manager_assignment_id === undefined ||
    String(payload.primary_manager_assignment_id).trim() === ''
      ? null
      : normalizeAssignmentId(
          payload.primary_manager_assignment_id,
          'Primary Manager Assignment'
        );

  await withAssignmentTransaction(async (executor) => {
    const employee = await lockEmployee(id, executor);
    if (!employee) {
      throw domainError('Employee not found.', 'EMPLOYEE_NOT_FOUND', 404);
    }

    const current = await getCurrentAssignmentForUpdate(id, executor);
    await assertOrganizationChoice(choice, executor);

    const changeType = normalizeAssignmentChangeType(payload.change_type, {
      initial: !current,
    });

    if (current && !assignmentDiffers(current, choice)) {
      throw domainError(
        'The selected Business Unit, Position and Job Grade are the same as the current assignment.',
        'EMPLOYEE_ASSIGNMENT_NO_CHANGE',
        409
      );
    }

    if (current) {
      assertAssignmentTransitionDate(current, effectiveFrom);
    }

    let requestedManager = null;
    if (requestedManagerId) {
      requestedManager = await getActiveAssignmentById(
        requestedManagerId,
        executor
      );

      if (!requestedManager) {
        throw domainError(
          'Selected Primary Manager does not have an active assignment.',
          'EMPLOYEE_ASSIGNMENT_MANAGER_UNAVAILABLE',
          409
        );
      }

      if (Number(requestedManager.employee_id) === id) {
        throw domainError(
          'Employee cannot report to their own assignment.',
          'EMPLOYEE_ASSIGNMENT_SELF_MANAGER',
          409
        );
      }
    }

    let outgoing = [];
    let incoming = [];
    let oldAssignment = null;
    let oldEndDate = null;

    if (current) {
      oldAssignment = { ...current };
      outgoing = await listActiveOutgoingLines(current.id, executor);
      incoming = await listActiveIncomingLines(current.id, executor);

      assertReportingLinesCanClose([...outgoing, ...incoming], effectiveFrom);

      oldEndDate = previousDateYmd(effectiveFrom);
      const lineIds = [...outgoing, ...incoming]
        .map((line) => Number(line.id))
        .filter((value, index, array) => array.indexOf(value) === index);

      if (lineIds.length) {
        await closeReportingLines(lineIds, oldEndDate, executor);
      }

      await closeAssignment(current.id, oldEndDate, executor);
    }

    const newAssignment = await insertAssignment({
      employeeId: id,
      ...choice,
      effectiveFrom,
      changeType,
      changeReason,
      changeNote,
      actorUserId: actorUserId ? Number(actorUserId) : null,
      executor,
    });

    const activeEdges = await listActiveReportingEdges(executor);
    const projectedEdges = activeEdges.map((edge) => ({
      employee_assignment_id: Number(edge.employee_assignment_id),
      reports_to_assignment_id: Number(edge.reports_to_assignment_id),
    }));

    // Preserve employees that currently report to this employee.
    // Their relationship history is closed against the old assignment and a
    // new row is created against the employee's new assignment.
    let carriedIncoming = 0;
    for (const line of incoming) {
      const childAssignmentId = Number(line.employee_assignment_id);

      if (
        wouldCreateReportingCycle({
          employeeAssignmentId: childAssignmentId,
          reportsToAssignmentId: Number(newAssignment.id),
          edges: projectedEdges,
        })
      ) {
        throw domainError(
          'This assignment transition would create a Reporting Line cycle for a subordinate.',
          'EMPLOYEE_ASSIGNMENT_REPORTING_CYCLE',
          409
        );
      }

      await insertReportingLine({
        employeeAssignmentId: childAssignmentId,
        reportsToAssignmentId: Number(newAssignment.id),
        relationshipType: line.relationship_type,
        effectiveFrom,
        executor,
      });

      projectedEdges.push({
        employee_assignment_id: childAssignmentId,
        reports_to_assignment_id: Number(newAssignment.id),
      });
      carriedIncoming += 1;
    }

    const oldPrimary = outgoing.find(
      (line) => line.relationship_type === 'PRIMARY'
    ) || null;

    let primaryManagerAssignmentId = null;

    if (managerWasExplicit) {
      primaryManagerAssignmentId = requestedManager
        ? Number(requestedManager.id)
        : null;
    } else if (oldPrimary) {
      const carryManager = await getActiveAssignmentById(
        oldPrimary.reports_to_assignment_id,
        executor
      );
      primaryManagerAssignmentId = carryManager
        ? Number(carryManager.id)
        : null;
    }

    if (primaryManagerAssignmentId) {
      if (
        wouldCreateReportingCycle({
          employeeAssignmentId: Number(newAssignment.id),
          reportsToAssignmentId: primaryManagerAssignmentId,
          edges: projectedEdges,
        })
      ) {
        throw domainError(
          'Selected Primary Manager would create a Reporting Line cycle.',
          'EMPLOYEE_ASSIGNMENT_REPORTING_CYCLE',
          409
        );
      }

      await insertReportingLine({
        employeeAssignmentId: Number(newAssignment.id),
        reportsToAssignmentId: primaryManagerAssignmentId,
        relationshipType: 'PRIMARY',
        effectiveFrom,
        executor,
      });

      projectedEdges.push({
        employee_assignment_id: Number(newAssignment.id),
        reports_to_assignment_id: primaryManagerAssignmentId,
      });
    }

    // Preserve DOTTED managers when their manager assignment is still active.
    // DOTTED lines remain editable from Organization -> Reporting Lines.
    let carriedDotted = 0;
    for (const line of outgoing.filter(
      (item) => item.relationship_type === 'DOTTED'
    )) {
      const manager = await getActiveAssignmentById(
        line.reports_to_assignment_id,
        executor
      );
      if (!manager) continue;

      const managerAssignmentId = Number(manager.id);

      if (
        wouldCreateReportingCycle({
          employeeAssignmentId: Number(newAssignment.id),
          reportsToAssignmentId: managerAssignmentId,
          edges: projectedEdges,
        })
      ) {
        throw domainError(
          'Carrying a DOTTED Reporting Line would create a cycle.',
          'EMPLOYEE_ASSIGNMENT_REPORTING_CYCLE',
          409
        );
      }

      await insertReportingLine({
        employeeAssignmentId: Number(newAssignment.id),
        reportsToAssignmentId: managerAssignmentId,
        relationshipType: 'DOTTED',
        effectiveFrom,
        executor,
      });

      projectedEdges.push({
        employee_assignment_id: Number(newAssignment.id),
        reports_to_assignment_id: managerAssignmentId,
      });
      carriedDotted += 1;
    }

    await syncLegacyOrganizationFields({
      employeeId: id,
      assignment: newAssignment,
      primaryManagerAssignmentId,
      executor,
    });

    await recordAssignmentAudit({
      actorUserId: actorUserId ? Number(actorUserId) : null,
      action: current
        ? 'EMPLOYEE_ASSIGNMENT.TRANSITIONED'
        : 'EMPLOYEE_ASSIGNMENT.CREATED',
      assignmentId: newAssignment.id,
      metadata: {
        employee_id: id,
        change_type: changeType,
        effective_from: effectiveFrom,
        previous_assignment: oldAssignment
          ? {
              id: oldAssignment.id,
              business_unit_id: oldAssignment.business_unit_id,
              position_id: oldAssignment.position_id,
              job_grade_id: oldAssignment.job_grade_id,
              effective_from: oldAssignment.effective_from,
              effective_to: oldEndDate,
            }
          : null,
        next_assignment: {
          id: newAssignment.id,
          business_unit_id: newAssignment.business_unit_id,
          position_id: newAssignment.position_id,
          job_grade_id: newAssignment.job_grade_id,
        },
        primary_manager_assignment_id: primaryManagerAssignmentId,
        reporting_continuity: {
          subordinate_lines_carried: carriedIncoming,
          dotted_lines_carried: carriedDotted,
        },
        change_reason: changeReason,
        change_note: changeNote,
      },
      executor,
    });
  });

  return getEmployeeAssignmentOverview({
    employeeId: id,
    locale,
  });
}

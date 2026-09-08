import assert from 'node:assert/strict';
import {
  normalizeReportingRelationshipType,
  wouldCreateReportingCycle,
} from '../src/modules/organization/reporting-lines/reporting-line.policy.js';

export async function run() {
  assert.equal(normalizeReportingRelationshipType('primary'), 'PRIMARY');
  assert.equal(normalizeReportingRelationshipType('DOTTED'), 'DOTTED');
  assert.throws(() => normalizeReportingRelationshipType('MANAGER'));

  const edges = [
    { employee_assignment_id: 2, reports_to_assignment_id: 3 },
    { employee_assignment_id: 3, reports_to_assignment_id: 4 },
  ];

  assert.equal(
    wouldCreateReportingCycle({
      employeeAssignmentId: 1,
      reportsToAssignmentId: 2,
      edges,
    }),
    false
  );

  assert.equal(
    wouldCreateReportingCycle({
      employeeAssignmentId: 4,
      reportsToAssignmentId: 2,
      edges,
    }),
    true
  );

  assert.equal(
    wouldCreateReportingCycle({
      employeeAssignmentId: 5,
      reportsToAssignmentId: 5,
      edges: [],
    }),
    true
  );

  // Existing unrelated bad graph cannot hang cycle detection.
  assert.equal(
    wouldCreateReportingCycle({
      employeeAssignmentId: 10,
      reportsToAssignmentId: 20,
      edges: [
        { employee_assignment_id: 20, reports_to_assignment_id: 21 },
        { employee_assignment_id: 21, reports_to_assignment_id: 20 },
      ],
    }),
    false
  );
}

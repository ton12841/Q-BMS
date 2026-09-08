import assert from 'node:assert/strict';
import {
  assignmentDiffers,
  assertAssignmentTransitionDate,
  assertReportingLinesCanClose,
  normalizeAssignmentChangeType,
  normalizeAssignmentDate,
  previousDateYmd,
} from '../src/modules/employee/organization-assignment/employee-assignment.policy.js';

export async function run() {
  assert.equal(
    normalizeAssignmentChangeType('promotion'),
    'PROMOTION'
  );
  assert.throws(() => normalizeAssignmentChangeType('INITIAL'));

  assert.equal(
    normalizeAssignmentDate('2026-09-04', {
      now: new Date('2026-09-04T12:00:00'),
    }),
    '2026-09-04'
  );

  assert.throws(() =>
    normalizeAssignmentDate('2026-09-05', {
      now: new Date('2026-09-04T12:00:00'),
    })
  );

  assert.equal(previousDateYmd('2026-09-04'), '2026-09-03');

  assert.equal(
    assignmentDiffers(
      {
        business_unit_id: 1,
        position_id: 2,
        job_grade_id: 3,
      },
      {
        businessUnitId: 1,
        positionId: 2,
        jobGradeId: 3,
      }
    ),
    false
  );

  assert.equal(
    assignmentDiffers(
      {
        business_unit_id: 1,
        position_id: 2,
        job_grade_id: 3,
      },
      {
        businessUnitId: 1,
        positionId: 4,
        jobGradeId: 3,
      }
    ),
    true
  );

  assert.throws(() =>
    assertAssignmentTransitionDate(
      { effective_from: '2026-09-04' },
      '2026-09-04'
    )
  );

  assert.doesNotThrow(() =>
    assertAssignmentTransitionDate(
      { effective_from: '2026-09-03' },
      '2026-09-04'
    )
  );

  assert.throws(() =>
    assertReportingLinesCanClose(
      [{ effective_from: '2026-09-04' }],
      '2026-09-04'
    )
  );
}

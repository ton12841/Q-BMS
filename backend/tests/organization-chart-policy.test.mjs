import assert from 'node:assert/strict';
import { buildOrganizationChartTopology } from '../src/modules/organization/organization-chart/organization-chart.policy.js';

export async function run() {
  const nodes = [
    { assignmentId: '1' },
    { assignmentId: '2' },
    { assignmentId: '3' },
    { assignmentId: '4' },
  ];
  const edges = [
    { employeeAssignmentId: '2', reportsToAssignmentId: '1', relationshipType: 'PRIMARY' },
    { employeeAssignmentId: '3', reportsToAssignmentId: '1', relationshipType: 'PRIMARY' },
    { employeeAssignmentId: '4', reportsToAssignmentId: '2', relationshipType: 'PRIMARY' },
    { employeeAssignmentId: '4', reportsToAssignmentId: '3', relationshipType: 'DOTTED' },
  ];

  const topology = buildOrganizationChartTopology(nodes, edges);

  assert.deepEqual(topology.rootAssignmentIds, ['1']);
  assert.equal(topology.primaryByChild['4'], '2');
  assert.equal(topology.dottedCount, 1);
  assert.equal(topology.orphanEdgeCount, 0);
  assert.equal(topology.duplicatePrimaryCount, 0);

  const withOrphan = buildOrganizationChartTopology(nodes, [
    ...edges,
    { employeeAssignmentId: '999', reportsToAssignmentId: '1', relationshipType: 'PRIMARY' },
  ]);
  assert.equal(withOrphan.orphanEdgeCount, 1);
}

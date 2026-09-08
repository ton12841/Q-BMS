export function buildOrganizationChartTopology(nodes = [], edges = []) {
  const nodeIds = new Set(nodes.map((node) => String(node.assignmentId ?? node.assignment_id)));
  const primaryByChild = new Map();
  const dotted = [];
  const orphanEdges = [];
  const duplicatePrimary = [];

  for (const edge of edges) {
    const child = String(edge.employeeAssignmentId ?? edge.employee_assignment_id);
    const manager = String(edge.reportsToAssignmentId ?? edge.reports_to_assignment_id);
    const type = String(edge.relationshipType ?? edge.relationship_type ?? '').toUpperCase();

    if (!nodeIds.has(child) || !nodeIds.has(manager)) {
      orphanEdges.push(edge);
      continue;
    }

    if (type === 'PRIMARY') {
      if (primaryByChild.has(child)) duplicatePrimary.push(edge);
      else primaryByChild.set(child, manager);
    } else if (type === 'DOTTED') {
      dotted.push(edge);
    }
  }

  const roots = nodes
    .map((node) => String(node.assignmentId ?? node.assignment_id))
    .filter((id) => !primaryByChild.has(id));

  return {
    rootAssignmentIds: roots,
    primaryByChild: Object.fromEntries(primaryByChild.entries()),
    dottedCount: dotted.length,
    orphanEdgeCount: orphanEdges.length,
    duplicatePrimaryCount: duplicatePrimary.length,
  };
}

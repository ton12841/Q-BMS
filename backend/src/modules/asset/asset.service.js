import {
  assignExistingAsset,
  listAvailableAssets,
  listEmployeeAssetAssignments,
  registerAssetAndAssign,
  returnEmployeeAsset,
} from './asset.repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

export function normalizeId(value, label = 'ID') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`A valid ${label} is required.`);
  return id;
}

export function normalizeNote(value, max = 4000) {
  const note = String(value ?? '').trim();
  if (note.length > max) throw badRequest(`Note must be ${max.toLocaleString()} characters or fewer.`);
  return note || null;
}

export function getAvailableAssets({ search }) {
  return listAvailableAssets({ search: String(search || '').trim() });
}

export function getEmployeeAssets(employeeId) {
  return listEmployeeAssetAssignments(normalizeId(employeeId, 'Employee ID'));
}

export function createAndAssignAsset({ employeeId, actorUserId, payload }) {
  const id = normalizeId(employeeId, 'Employee ID');
  return registerAssetAndAssign({
    employeeId: id,
    actorUserId: actorUserId ? normalizeId(actorUserId, 'User ID') : null,
    note: normalizeNote(payload?.assignmentNote),
    asset: {
      assetCode: String(payload?.assetCode || '').trim(),
      assetName: String(payload?.assetName || '').trim(),
      assetType: String(payload?.assetType || '').trim(),
      serialNumber: String(payload?.serialNumber || '').trim(),
      notes: String(payload?.assetNotes || '').trim(),
    },
  });
}

export function assignAsset({ assetId, employeeId, actorUserId, payload }) {
  return assignExistingAsset({
    assetId: normalizeId(assetId, 'Asset ID'),
    employeeId: normalizeId(employeeId, 'Employee ID'),
    actorUserId: actorUserId ? normalizeId(actorUserId, 'User ID') : null,
    note: normalizeNote(payload?.note),
  });
}

export function returnAsset({ assignmentId, employeeId, actorUserId, payload }) {
  return returnEmployeeAsset({
    assignmentId: normalizeId(assignmentId, 'Asset Assignment ID'),
    employeeId: normalizeId(employeeId, 'Employee ID'),
    actorUserId: actorUserId ? normalizeId(actorUserId, 'User ID') : null,
    note: normalizeNote(payload?.note),
  });
}

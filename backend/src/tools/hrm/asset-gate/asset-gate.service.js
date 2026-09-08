import {
  assignAsset,
  createAndAssignAsset,
  getAvailableAssets,
  getEmployeeAssets,
  normalizeId,
  normalizeNote,
  returnAsset,
} from '../../../modules/asset/asset.service.js';
import {
  assertAssetGateOpen,
  completeGateWithAssets,
  completeGateWithoutAssets,
  getAssetGateCase,
  listAssetGateCases,
  listAssetGateHistory,
  recordAssetGateEvent,
} from './asset-gate.repository.js';

export function listGates({ locale }) {
  return listAssetGateCases({ locale });
}

export async function getGateDetail({ employeeId, locale, search = '' }) {
  const id = normalizeId(employeeId, 'Employee ID');
  const gate = await getAssetGateCase(id);
  if (!gate) {
    const error = new Error('Asset Gate case was not found.');
    error.statusCode = 404;
    throw error;
  }
  const [assignments, availableAssets, history] = await Promise.all([
    getEmployeeAssets(id),
    getAvailableAssets({ search }),
    listAssetGateHistory(id),
  ]);
  return { gate, assignments, available_assets: availableAssets, history, locale };
}

export async function registerAndAssign({ employeeId, payload, auth, locale }) {
  const id = normalizeId(employeeId, 'Employee ID');
  await assertAssetGateOpen(id);
  const result = await createAndAssignAsset({ employeeId: id, actorUserId: auth?.user?.id || null, payload });
  await recordAssetGateEvent({
    employeeId: id,
    eventType: 'ASSET_ASSIGNED',
    actorUserId: auth?.user?.id || null,
    assetId: result.asset.id,
    assignmentId: result.assignment.id,
    note: normalizeNote(payload?.assignmentNote),
    metadata: { registration: 'QUICK_REGISTER' },
  });
  return getGateDetail({ employeeId: id, locale });
}

export async function assignExisting({ employeeId, assetId, payload, auth, locale }) {
  const id = normalizeId(employeeId, 'Employee ID');
  await assertAssetGateOpen(id);
  const assignment = await assignAsset({ assetId, employeeId: id, actorUserId: auth?.user?.id || null, payload });
  await recordAssetGateEvent({
    employeeId: id,
    eventType: 'ASSET_ASSIGNED',
    actorUserId: auth?.user?.id || null,
    assetId: Number(assetId),
    assignmentId: assignment.id,
    note: normalizeNote(payload?.note),
    metadata: { registration: 'EXISTING_ASSET' },
  });
  return getGateDetail({ employeeId: id, locale });
}

export async function removeAssignment({ employeeId, assignmentId, payload, auth, locale }) {
  const id = normalizeId(employeeId, 'Employee ID');
  await assertAssetGateOpen(id);
  const returned = await returnAsset({ assignmentId, employeeId: id, actorUserId: auth?.user?.id || null, payload });
  await recordAssetGateEvent({
    employeeId: id,
    eventType: 'ASSET_RETURNED',
    actorUserId: auth?.user?.id || null,
    assetId: returned.asset_id,
    assignmentId: Number(assignmentId),
    note: normalizeNote(payload?.note),
  });
  return getGateDetail({ employeeId: id, locale });
}

export async function completeWithAssets({ employeeId, payload, auth, locale }) {
  const id = normalizeId(employeeId, 'Employee ID');
  await completeGateWithAssets({ employeeId: id, actorUserId: auth?.user?.id || null, note: normalizeNote(payload?.note) });
  return getGateDetail({ employeeId: id, locale });
}

export async function noAssetRequired({ employeeId, payload, auth, locale }) {
  const id = normalizeId(employeeId, 'Employee ID');
  await completeGateWithoutAssets({ employeeId: id, actorUserId: auth?.user?.id || null, note: normalizeNote(payload?.note) });
  return getGateDetail({ employeeId: id, locale });
}

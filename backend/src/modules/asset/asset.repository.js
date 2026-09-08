import { db } from '../../config/database/postgres.js';

function assetError(message, statusCode = 409, code = 'ASSET_INVALID_STATE') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

export async function listAvailableAssets({ search = '' } = {}) {
  const q = String(search || '').trim();
  const result = await db.query(
    `SELECT id, asset_code, asset_name, asset_type, product_id, serial_number,
            status, current_location_id, notes, metadata, created_at, updated_at
     FROM assets
     WHERE status = 'AVAILABLE'
       AND ($1 = '' OR asset_code ILIKE '%' || $1 || '%'
                    OR asset_name ILIKE '%' || $1 || '%'
                    OR asset_type ILIKE '%' || $1 || '%'
                    OR COALESCE(serial_number, '') ILIKE '%' || $1 || '%')
     ORDER BY asset_type, asset_name, asset_code
     LIMIT 200`,
    [q]
  );
  return result.rows;
}

export async function listEmployeeAssetAssignments(employeeId) {
  const result = await db.query(
    `SELECT aa.id AS assignment_id, aa.asset_id, aa.employee_id, aa.assignment_status,
            aa.assigned_at, aa.returned_at, aa.assigned_by_user_id, aa.returned_by_user_id,
            aa.notes AS assignment_notes,
            a.asset_code, a.asset_name, a.asset_type, a.serial_number, a.status AS asset_status
     FROM asset_assignments aa
     INNER JOIN assets a ON a.id = aa.asset_id
     WHERE aa.employee_id = $1
       AND aa.assignment_status = 'ACTIVE'
       AND aa.returned_at IS NULL
     ORDER BY aa.assigned_at DESC, aa.id DESC`,
    [employeeId]
  );
  return result.rows;
}

export async function registerAssetAndAssign({ employeeId, actorUserId = null, asset, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const code = String(asset.assetCode || '').trim();
    const name = String(asset.assetName || '').trim();
    const type = String(asset.assetType || '').trim();
    const serial = String(asset.serialNumber || '').trim() || null;
    if (!code || !name || !type) throw assetError('Asset Code, Asset Name and Asset Type are required.', 400, 'ASSET_REQUIRED_FIELDS');

    const created = await client.query(
      `INSERT INTO assets (asset_code, asset_name, asset_type, serial_number, status, notes)
       VALUES ($1,$2,$3,$4,'AVAILABLE',$5)
       RETURNING *`,
      [code, name, type, serial, String(asset.notes || '').trim() || null]
    );
    const row = created.rows[0];

    const assigned = await client.query(
      `INSERT INTO asset_assignments (asset_id, employee_id, assigned_by_user_id, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [row.id, employeeId, actorUserId, note]
    );
    await client.query(`UPDATE assets SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1`, [row.id]);
    await client.query('COMMIT');
    return { asset: row, assignment: assigned.rows[0] };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    if (error?.code === '23505') throw assetError('Asset Code or Serial Number already exists.', 409, 'ASSET_DUPLICATE');
    throw error;
  } finally {
    client.release();
  }
}

export async function assignExistingAsset({ assetId, employeeId, actorUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const assetResult = await client.query(`SELECT * FROM assets WHERE id = $1 FOR UPDATE`, [assetId]);
    const asset = assetResult.rows[0];
    if (!asset) throw assetError('Asset was not found.', 404, 'ASSET_NOT_FOUND');
    if (asset.status !== 'AVAILABLE') throw assetError('This asset is not available for assignment.', 409, 'ASSET_NOT_AVAILABLE');

    const assigned = await client.query(
      `INSERT INTO asset_assignments (asset_id, employee_id, assigned_by_user_id, notes)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [assetId, employeeId, actorUserId, note]
    );
    await client.query(`UPDATE assets SET status = 'ASSIGNED', updated_at = NOW() WHERE id = $1`, [assetId]);
    await client.query('COMMIT');
    return assigned.rows[0];
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    if (error?.code === '23505') throw assetError('This asset already has an active assignment.', 409, 'ASSET_ALREADY_ASSIGNED');
    throw error;
  } finally {
    client.release();
  }
}

export async function returnEmployeeAsset({ assignmentId, employeeId, actorUserId = null, note = null }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT aa.*, a.status AS asset_status
       FROM asset_assignments aa
       INNER JOIN assets a ON a.id = aa.asset_id
       WHERE aa.id = $1 AND aa.employee_id = $2
       FOR UPDATE OF aa, a`,
      [assignmentId, employeeId]
    );
    const row = locked.rows[0];
    if (!row) throw assetError('Active asset assignment was not found.', 404, 'ASSET_ASSIGNMENT_NOT_FOUND');
    if (row.assignment_status !== 'ACTIVE' || row.returned_at) throw assetError('This assignment is already closed.', 409, 'ASSET_ASSIGNMENT_CLOSED');

    await client.query(
      `UPDATE asset_assignments
       SET assignment_status = 'RETURNED', returned_at = NOW(), returned_by_user_id = $3,
           notes = CASE WHEN $4::text IS NULL THEN notes ELSE CONCAT_WS(E'\n', notes, $4::text) END,
           updated_at = NOW()
       WHERE id = $1 AND employee_id = $2`,
      [assignmentId, employeeId, actorUserId, note]
    );
    await client.query(`UPDATE assets SET status = 'AVAILABLE', updated_at = NOW() WHERE id = $1`, [row.asset_id]);
    await client.query('COMMIT');
    return { assignment_id: assignmentId, asset_id: row.asset_id, status: 'RETURNED' };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}

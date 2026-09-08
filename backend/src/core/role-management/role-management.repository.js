import { db } from '../../config/database/postgres.js';

const PROTECTED_ROLE_CODES = new Set(['EMPLOYEE', 'SUPER_ADMIN']);

function normalizePermissionCodes(permissionCodes) {
  return Array.from(
    new Set(
      (permissionCodes || [])
        .map((code) => String(code || '').trim())
        .filter(Boolean)
    )
  );
}

export async function listRoleManagementRoles() {
  const result = await db.query(`
    SELECT
      r.id,
      r.code,
      r.name,
      r.description,
      r.role_category,
      r.is_system_role,
      r.is_assignable,
      r.status,
      r.sort_order,
      COUNT(DISTINCT ur.user_id)::int AS assigned_user_count,
      COALESCE(
        json_agg(
          json_build_object(
            'code', p.code,
            'name', p.name,
            'permissionGroup', p.permission_group
          )
          ORDER BY p.permission_group NULLS LAST, p.code
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
      ) AS permissions
    FROM roles r
    LEFT JOIN user_roles ur ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    GROUP BY r.id
    ORDER BY
      CASE r.role_category
        WHEN 'BASE' THEN 1
        WHEN 'ADMIN' THEN 2
        WHEN 'SYSTEM' THEN 3
        ELSE 4
      END,
      r.sort_order,
      r.code
  `);

  return result.rows;
}

export async function listRoleManagementPermissions() {
  const result = await db.query(`
    SELECT
      id,
      code,
      name,
      description,
      permission_group,
      COALESCE(level_grade_policy_eligible, FALSE) AS level_grade_policy_eligible
    FROM permissions
    ORDER BY permission_group NULLS LAST, code
  `);

  return result.rows;
}

export async function getRoleManagementCounts() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_roles,
      COUNT(*) FILTER (WHERE is_system_role = TRUE)::int AS system_roles,
      COUNT(*) FILTER (WHERE is_system_role = FALSE)::int AS custom_roles,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_roles,
      (SELECT COUNT(*)::int FROM permissions) AS permission_count
    FROM roles
  `);

  return result.rows[0];
}

async function resolvePermissionIds(permissionCodes, client) {
  const normalized = normalizePermissionCodes(permissionCodes);

  if (!normalized.length) {
    return { normalized, rows: [] };
  }

  const result = await client.query(
    `
      SELECT id, code
      FROM permissions
      WHERE code = ANY($1::text[])
    `,
    [normalized]
  );

  const found = result.rows.map((row) => row.code);
  const missing = normalized.filter((code) => !found.includes(code));

  if (missing.length) {
    const error = new Error(`Unknown Permission: ${missing.join(', ')}`);
    error.statusCode = 400;
    error.code = 'ROLE_MANAGEMENT_PERMISSION_INVALID';
    throw error;
  }

  return { normalized, rows: result.rows };
}

async function replaceRolePermissions({
  roleId,
  permissionCodes,
  client,
}) {
  const resolved = await resolvePermissionIds(permissionCodes, client);

  await client.query(
    `DELETE FROM role_permissions WHERE role_id = $1`,
    [roleId]
  );

  if (resolved.rows.length) {
    await client.query(
      `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT $1, p.id
        FROM permissions p
        WHERE p.code = ANY($2::text[])
        ON CONFLICT DO NOTHING
      `,
      [roleId, resolved.normalized]
    );
  }

  return resolved.normalized;
}

export async function createCustomAdminRole({
  code,
  name,
  description,
  permissionCodes,
  actorUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const normalizedCode = String(code || '').trim().toUpperCase();
    const normalizedName = String(name || '').trim();
    const normalizedDescription = String(description || '').trim() || null;

    if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(normalizedCode)) {
      const error = new Error(
        'Role Code must use A-Z, 0-9 and underscore, starting with a letter.'
      );
      error.statusCode = 400;
      error.code = 'ROLE_MANAGEMENT_CODE_INVALID';
      throw error;
    }

    if (!normalizedName || normalizedName.length > 120) {
      const error = new Error('Role Name is required and must be 120 characters or fewer.');
      error.statusCode = 400;
      error.code = 'ROLE_MANAGEMENT_NAME_INVALID';
      throw error;
    }

    const exists = await client.query(
      `SELECT id FROM roles WHERE code = $1 LIMIT 1`,
      [normalizedCode]
    );

    if (exists.rows[0]) {
      const error = new Error('Role Code already exists.');
      error.statusCode = 409;
      error.code = 'ROLE_MANAGEMENT_CODE_EXISTS';
      throw error;
    }

    const sortResult = await client.query(`
      SELECT COALESCE(MAX(sort_order), 160)::int + 10 AS next_sort_order
      FROM roles
      WHERE role_category = 'ADMIN'
    `);

    const roleResult = await client.query(
      `
        INSERT INTO roles (
          code,
          name,
          description,
          is_system_role,
          status,
          role_category,
          is_assignable,
          sort_order
        )
        VALUES ($1, $2, $3, FALSE, 'ACTIVE', 'ADMIN', TRUE, $4)
        RETURNING *
      `,
      [
        normalizedCode,
        normalizedName,
        normalizedDescription,
        Number(sortResult.rows[0]?.next_sort_order || 170),
      ]
    );

    const role = roleResult.rows[0];

    const afterPermissions = await replaceRolePermissions({
      roleId: role.id,
      permissionCodes,
      client,
    });

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES (
          $1,
          'ROLE_MANAGEMENT.ROLE_CREATED',
          'ROLE',
          $2,
          $3::jsonb
        )
      `,
      [
        actorUserId || null,
        String(role.id),
        JSON.stringify({
          code: role.code,
          name: role.name,
          roleCategory: role.role_category,
          isSystemRole: role.is_system_role,
          permissions: afterPermissions,
        }),
      ]
    );

    await client.query('COMMIT');

    return {
      id: String(role.id),
      code: role.code,
      name: role.name,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRoleManagementRole({
  roleId,
  name,
  description,
  status,
  permissionCodes,
  actorUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const roleResult = await client.query(
      `
        SELECT *
        FROM roles
        WHERE id = $1
        FOR UPDATE
      `,
      [roleId]
    );

    const role = roleResult.rows[0];

    if (!role) {
      const error = new Error('Role was not found.');
      error.statusCode = 404;
      error.code = 'ROLE_MANAGEMENT_ROLE_NOT_FOUND';
      throw error;
    }

    if (PROTECTED_ROLE_CODES.has(role.code)) {
      const error = new Error(`${role.code} is a protected Q BMS Role.`);
      error.statusCode = 400;
      error.code = 'ROLE_MANAGEMENT_ROLE_PROTECTED';
      throw error;
    }

    if (role.role_category !== 'ADMIN') {
      const error = new Error('Only Admin Roles are editable from Role Management.');
      error.statusCode = 400;
      error.code = 'ROLE_MANAGEMENT_CATEGORY_LOCKED';
      throw error;
    }

    const beforePermissionResult = await client.query(
      `
        SELECT p.code
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.code
      `,
      [role.id]
    );

    const before = {
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: beforePermissionResult.rows.map((row) => row.code),
    };

    let nextName = role.name;
    let nextDescription = role.description;
    let nextStatus = role.status;

    if (!role.is_system_role) {
      const requestedName = String(name ?? role.name).trim();
      if (!requestedName || requestedName.length > 120) {
        const error = new Error(
          'Role Name is required and must be 120 characters or fewer.'
        );
        error.statusCode = 400;
        error.code = 'ROLE_MANAGEMENT_NAME_INVALID';
        throw error;
      }

      nextName = requestedName;
      nextDescription =
        String(description ?? '').trim() || null;

      if (status !== undefined) {
        const normalizedStatus = String(status).trim().toUpperCase();
        if (!['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
          const error = new Error('Role status must be ACTIVE or INACTIVE.');
          error.statusCode = 400;
          error.code = 'ROLE_MANAGEMENT_STATUS_INVALID';
          throw error;
        }
        nextStatus = normalizedStatus;
      }

      await client.query(
        `
          UPDATE roles
          SET
            name = $2,
            description = $3,
            status = $4
          WHERE id = $1
        `,
        [role.id, nextName, nextDescription, nextStatus]
      );
    }

    const afterPermissions = await replaceRolePermissions({
      roleId: role.id,
      permissionCodes,
      client,
    });

    const after = {
      name: nextName,
      description: nextDescription,
      status: nextStatus,
      permissions: afterPermissions,
    };

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES (
          $1,
          'ROLE_MANAGEMENT.ROLE_UPDATED',
          'ROLE',
          $2,
          $3::jsonb
        )
      `,
      [
        actorUserId || null,
        String(role.id),
        JSON.stringify({
          code: role.code,
          isSystemRole: role.is_system_role,
          before,
          after,
        }),
      ]
    );

    await client.query('COMMIT');

    return {
      id: String(role.id),
      code: role.code,
      name: after.name,
      status: after.status,
      permissionCodes: after.permissions,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

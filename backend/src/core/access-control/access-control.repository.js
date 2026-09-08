import { db } from '../../config/database/postgres.js';

export async function listAccessControlRoles() {
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
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE r.status = 'ACTIVE'
    GROUP BY r.id
    ORDER BY r.sort_order, r.code
  `);

  return result.rows;
}

export async function listAccessControlPermissions() {
  const result = await db.query(`
    SELECT id, code, name, description, permission_group
    FROM permissions
    ORDER BY permission_group NULLS LAST, code
  `);

  return result.rows;
}

export async function listAccessControlUsers() {
  const result = await db.query(`
    SELECT
      u.id,
      u.employee_id,
      u.email,
      u.account_status,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      assignment.business_unit_code,
      assignment.business_unit_name,
      assignment.position_code,
      assignment.position_name,
      assignment.job_level_id,
      assignment.job_level_code,
      assignment.job_level_name,
      assignment.job_grade_id,
      assignment.grade_number,
      assignment.job_grade_name,
      COALESCE(
        array_agg(DISTINCT r.code)
          FILTER (WHERE r.code IS NOT NULL),
        ARRAY[]::varchar[]
      ) AS role_codes
    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id
    LEFT JOIN LATERAL (
      SELECT
        bu.code AS business_unit_code,
        bu.name AS business_unit_name,
        p.code AS position_code,
        p.name AS position_name,
        g.job_level_id,
        jl.code AS job_level_code,
        jl.name AS job_level_name,
        ea.job_grade_id,
        g.grade_number,
        g.name AS job_grade_name
      FROM employee_assignments ea
      JOIN business_units bu ON bu.id = ea.business_unit_id
      JOIN positions p ON p.id = ea.position_id
      JOIN job_grades g ON g.id = ea.job_grade_id
      JOIN job_levels jl ON jl.id = g.job_level_id
      WHERE ea.employee_id = e.id
        AND ea.is_primary = TRUE
        AND ea.assignment_status = 'ACTIVE'
        AND ea.effective_from <= CURRENT_DATE
        AND (ea.effective_to IS NULL OR ea.effective_to >= CURRENT_DATE)
      ORDER BY ea.effective_from DESC, ea.id DESC
      LIMIT 1
    ) assignment ON TRUE
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id AND r.status = 'ACTIVE'
    GROUP BY
      u.id,
      u.employee_id,
      u.email,
      u.account_status,
      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      assignment.business_unit_code,
      assignment.business_unit_name,
      assignment.position_code,
      assignment.position_name,
      assignment.job_level_id,
      assignment.job_level_code,
      assignment.job_level_name,
      assignment.job_grade_id,
      assignment.grade_number,
      assignment.job_grade_name
    ORDER BY
      COALESCE(e.first_name, ''),
      COALESCE(e.last_name, ''),
      u.email
  `);

  return result.rows;
}

export async function getAccessControlCounts() {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS user_count,
      (SELECT COUNT(*)::int FROM roles WHERE status = 'ACTIVE') AS role_count,
      (SELECT COUNT(*)::int FROM permissions) AS permission_count,
      (SELECT COUNT(*)::int FROM roles WHERE status = 'ACTIVE' AND role_category = 'ADMIN') AS admin_role_count
  `);

  return result.rows[0];
}

export async function findAccessControlUser(userId, client = db) {
  const result = await client.query(
    `
      SELECT
        u.id,
        u.employee_id,
        u.email,
        u.account_status,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname
      FROM users u
      LEFT JOIN employees e ON e.id = u.employee_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

export async function findActiveAssignableRoles(codes, client = db) {
  if (!codes.length) return [];

  const result = await client.query(
    `
      SELECT id, code, name, role_category, is_assignable
      FROM roles
      WHERE code = ANY($1::text[])
        AND status = 'ACTIVE'
        AND is_assignable = TRUE
      ORDER BY sort_order, code
    `,
    [codes]
  );

  return result.rows;
}

export async function listUserRoleCodes(userId, client = db) {
  const result = await client.query(
    `
      SELECT r.code
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.status = 'ACTIVE'
      ORDER BY r.sort_order, r.code
    `,
    [userId]
  );

  return result.rows.map((row) => row.code);
}

export async function replaceAssignableUserRoles({
  userId,
  roleCodes,
  actorUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const user = await findAccessControlUser(userId, client);
    if (!user) {
      const error = new Error('Q BMS user was not found.');
      error.statusCode = 404;
      error.code = 'ACCESS_CONTROL_USER_NOT_FOUND';
      throw error;
    }

    const before = await listUserRoleCodes(userId, client);
    const requested = Array.from(
      new Set((roleCodes || []).map((code) => String(code || '').trim()).filter(Boolean))
    );

    // EMPLOYEE is the permanent first/base role for employee-linked users.
    if (user.employee_id && !requested.includes('EMPLOYEE')) {
      requested.unshift('EMPLOYEE');
    }

    // Never let a Super Admin remove their own Super Admin role from the UI.
    if (
      actorUserId &&
      String(actorUserId) === String(userId) &&
      before.includes('SUPER_ADMIN') &&
      !requested.includes('SUPER_ADMIN')
    ) {
      requested.push('SUPER_ADMIN');
    }

    const resolved = await findActiveAssignableRoles(requested, client);
    const resolvedCodes = resolved.map((role) => role.code);
    const missing = requested.filter((code) => !resolvedCodes.includes(code));

    if (missing.length) {
      const error = new Error(`Unknown or non-assignable role: ${missing.join(', ')}`);
      error.statusCode = 400;
      error.code = 'ACCESS_CONTROL_ROLE_INVALID';
      throw error;
    }

    await client.query(
      `
        DELETE FROM user_roles ur
        USING roles r
        WHERE ur.user_id = $1
          AND ur.role_id = r.id
          AND r.is_assignable = TRUE
      `,
      [userId]
    );

    if (resolved.length) {
      await client.query(
        `
          INSERT INTO user_roles (user_id, role_id)
          SELECT $1, r.id
          FROM roles r
          WHERE r.code = ANY($2::text[])
            AND r.status = 'ACTIVE'
            AND r.is_assignable = TRUE
          ON CONFLICT DO NOTHING
        `,
        [userId, resolvedCodes]
      );
    }

    const after = await listUserRoleCodes(userId, client);

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES ($1, 'ACCESS_CONTROL.USER_ROLES_UPDATED', 'USER', $2, $3::jsonb)
      `,
      [
        actorUserId || null,
        String(userId),
        JSON.stringify({ before, after }),
      ]
    );

    await client.query('COMMIT');

    return {
      userId: String(userId),
      roleCodes: after,
      enforcedBaseRole: Boolean(user.employee_id),
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

export async function listOrganizationPermissionPolicy() {
  const [permissionResult, levelResult, gradeResult] = await Promise.all([
    db.query(`
      SELECT id, code, name, description, permission_group
      FROM permissions
      WHERE level_grade_policy_eligible = TRUE
      ORDER BY permission_group NULLS LAST, code
    `),
    db.query(`
      SELECT
        jl.id,
        jl.code,
        jl.name,
        jl.description,
        jl.sort_order,
        COALESCE(
          array_agg(p.code ORDER BY p.code)
            FILTER (WHERE p.code IS NOT NULL),
          ARRAY[]::varchar[]
        ) AS permission_codes
      FROM job_levels jl
      LEFT JOIN job_level_permission_grants jlp ON jlp.job_level_id = jl.id
      LEFT JOIN permissions p ON p.id = jlp.permission_id
      WHERE jl.status = 'ACTIVE'
      GROUP BY jl.id
      ORDER BY jl.sort_order, jl.code
    `),
    db.query(`
      SELECT
        g.id,
        g.grade_number,
        g.name,
        g.sort_order,
        jl.id AS job_level_id,
        jl.code AS job_level_code,
        jl.name AS job_level_name,
        COALESCE(
          json_agg(
            json_build_object(
              'permissionCode', p.code,
              'effect', jgo.override_effect
            )
            ORDER BY p.code
          ) FILTER (WHERE p.code IS NOT NULL),
          '[]'::json
        ) AS overrides
      FROM job_grades g
      JOIN job_levels jl ON jl.id = g.job_level_id
      LEFT JOIN job_grade_permission_overrides jgo ON jgo.job_grade_id = g.id
      LEFT JOIN permissions p ON p.id = jgo.permission_id
      WHERE g.status = 'ACTIVE'
      GROUP BY g.id, jl.id
      ORDER BY g.grade_number, g.sort_order
    `),
  ]);

  return {
    permissions: permissionResult.rows,
    levels: levelResult.rows,
    grades: gradeResult.rows,
  };
}

async function resolveEligiblePermissionIds(permissionCodes, client) {
  const normalized = Array.from(
    new Set((permissionCodes || []).map((code) => String(code || '').trim()).filter(Boolean))
  );

  if (!normalized.length) {
    return { normalized, rows: [] };
  }

  const result = await client.query(
    `
      SELECT id, code
      FROM permissions
      WHERE code = ANY($1::text[])
        AND level_grade_policy_eligible = TRUE
    `,
    [normalized]
  );

  const foundCodes = result.rows.map((row) => row.code);
  const missing = normalized.filter((code) => !foundCodes.includes(code));

  if (missing.length) {
    const error = new Error(
      `Permission is not eligible for Level / Grade policy: ${missing.join(', ')}`
    );
    error.statusCode = 400;
    error.code = 'LEVEL_GRADE_PERMISSION_NOT_ELIGIBLE';
    throw error;
  }

  return { normalized, rows: result.rows };
}

export async function replaceJobLevelPermissionGrants({
  jobLevelId,
  permissionCodes,
  actorUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const levelResult = await client.query(
      `SELECT id, code, name FROM job_levels WHERE id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [jobLevelId]
    );

    const level = levelResult.rows[0];
    if (!level) {
      const error = new Error('Job Level was not found.');
      error.statusCode = 404;
      error.code = 'JOB_LEVEL_NOT_FOUND';
      throw error;
    }

    const resolved = await resolveEligiblePermissionIds(permissionCodes, client);

    const beforeResult = await client.query(
      `
        SELECT p.code
        FROM job_level_permission_grants jlp
        JOIN permissions p ON p.id = jlp.permission_id
        WHERE jlp.job_level_id = $1
        ORDER BY p.code
      `,
      [jobLevelId]
    );

    await client.query(
      `DELETE FROM job_level_permission_grants WHERE job_level_id = $1`,
      [jobLevelId]
    );

    if (resolved.rows.length) {
      await client.query(
        `
          INSERT INTO job_level_permission_grants (
            job_level_id,
            permission_id,
            granted_at,
            updated_at
          )
          SELECT $1, p.id, NOW(), NOW()
          FROM permissions p
          WHERE p.code = ANY($2::text[])
            AND p.level_grade_policy_eligible = TRUE
          ON CONFLICT (job_level_id, permission_id)
          DO UPDATE SET updated_at = NOW()
        `,
        [jobLevelId, resolved.normalized]
      );
    }

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES ($1, 'ACCESS_CONTROL.JOB_LEVEL_POLICY_UPDATED', 'JOB_LEVEL', $2, $3::jsonb)
      `,
      [
        actorUserId || null,
        String(jobLevelId),
        JSON.stringify({
          levelCode: level.code,
          before: beforeResult.rows.map((row) => row.code),
          after: resolved.normalized,
        }),
      ]
    );

    await client.query('COMMIT');

    return {
      jobLevelId: String(jobLevelId),
      permissionCodes: resolved.normalized.sort(),
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

export async function replaceJobGradePermissionOverrides({
  jobGradeId,
  overrides,
  actorUserId = null,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const gradeResult = await client.query(
      `
        SELECT g.id, g.grade_number, g.name, jl.code AS job_level_code
        FROM job_grades g
        JOIN job_levels jl ON jl.id = g.job_level_id
        WHERE g.id = $1
          AND g.status = 'ACTIVE'
        LIMIT 1
      `,
      [jobGradeId]
    );

    const grade = gradeResult.rows[0];
    if (!grade) {
      const error = new Error('Job Grade was not found.');
      error.statusCode = 404;
      error.code = 'JOB_GRADE_NOT_FOUND';
      throw error;
    }

    const normalized = [];
    const seen = new Set();

    for (const item of Array.isArray(overrides) ? overrides : []) {
      const permissionCode = String(item?.permissionCode || '').trim();
      const effect = String(item?.effect || '').trim().toUpperCase();

      if (!permissionCode) continue;
      if (!['GRANT', 'REVOKE'].includes(effect)) {
        const error = new Error(`Invalid Grade override for ${permissionCode}.`);
        error.statusCode = 400;
        error.code = 'JOB_GRADE_OVERRIDE_INVALID';
        throw error;
      }

      if (seen.has(permissionCode)) {
        const error = new Error(`Duplicate Grade override: ${permissionCode}.`);
        error.statusCode = 400;
        error.code = 'JOB_GRADE_OVERRIDE_DUPLICATE';
        throw error;
      }

      seen.add(permissionCode);
      normalized.push({ permissionCode, effect });
    }

    await resolveEligiblePermissionIds(
      normalized.map((item) => item.permissionCode),
      client
    );

    const beforeResult = await client.query(
      `
        SELECT p.code AS permission_code, jgo.override_effect
        FROM job_grade_permission_overrides jgo
        JOIN permissions p ON p.id = jgo.permission_id
        WHERE jgo.job_grade_id = $1
        ORDER BY p.code
      `,
      [jobGradeId]
    );

    await client.query(
      `DELETE FROM job_grade_permission_overrides WHERE job_grade_id = $1`,
      [jobGradeId]
    );

    for (const item of normalized) {
      await client.query(
        `
          INSERT INTO job_grade_permission_overrides (
            job_grade_id,
            permission_id,
            override_effect,
            updated_at
          )
          SELECT $1, p.id, $3, NOW()
          FROM permissions p
          WHERE p.code = $2
            AND p.level_grade_policy_eligible = TRUE
          ON CONFLICT (job_grade_id, permission_id)
          DO UPDATE SET
            override_effect = EXCLUDED.override_effect,
            updated_at = NOW()
        `,
        [jobGradeId, item.permissionCode, item.effect]
      );
    }

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES ($1, 'ACCESS_CONTROL.JOB_GRADE_POLICY_UPDATED', 'JOB_GRADE', $2, $3::jsonb)
      `,
      [
        actorUserId || null,
        String(jobGradeId),
        JSON.stringify({
          gradeNumber: Number(grade.grade_number),
          before: beforeResult.rows.map((row) => ({
            permissionCode: row.permission_code,
            effect: row.override_effect,
          })),
          after: normalized,
        }),
      ]
    );

    await client.query('COMMIT');

    return {
      jobGradeId: String(jobGradeId),
      overrides: normalized,
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

export async function getPermissionPreviewContext(userId) {
  const userResult = await db.query(
    `
      SELECT
        u.id,
        u.employee_id,
        u.email,
        u.account_status,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname,
        e.employee_status,
        assignment.business_unit_id,
        assignment.business_unit_code,
        assignment.business_unit_name,
        assignment.position_id,
        assignment.position_code,
        assignment.position_name,
        assignment.job_grade_id,
        assignment.grade_number,
        assignment.job_grade_name,
        assignment.job_level_id,
        assignment.job_level_code,
        assignment.job_level_name
      FROM users u
      LEFT JOIN employees e ON e.id = u.employee_id
      LEFT JOIN LATERAL (
        SELECT
          ea.business_unit_id,
          bu.code AS business_unit_code,
          bu.name AS business_unit_name,
          ea.position_id,
          p.code AS position_code,
          p.name AS position_name,
          ea.job_grade_id,
          g.grade_number,
          g.name AS job_grade_name,
          g.job_level_id,
          jl.code AS job_level_code,
          jl.name AS job_level_name
        FROM employee_assignments ea
        JOIN business_units bu ON bu.id = ea.business_unit_id
        JOIN positions p ON p.id = ea.position_id
        JOIN job_grades g ON g.id = ea.job_grade_id
        JOIN job_levels jl ON jl.id = g.job_level_id
        WHERE ea.employee_id = e.id
          AND ea.is_primary = TRUE
          AND ea.assignment_status = 'ACTIVE'
          AND ea.effective_from <= CURRENT_DATE
          AND (ea.effective_to IS NULL OR ea.effective_to >= CURRENT_DATE)
        ORDER BY ea.effective_from DESC, ea.id DESC
        LIMIT 1
      ) assignment ON TRUE
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  return userResult.rows[0] || null;
}

export async function evaluateEffectivePermissions({
  userId = null,
  roleCodes = null,
  jobLevelId = null,
  jobGradeId = null,
}) {
  let resolvedRoleCodes = Array.isArray(roleCodes)
    ? Array.from(
        new Set(
          roleCodes
            .map((code) => String(code || '').trim())
            .filter(Boolean)
        )
      )
    : null;

  if (!resolvedRoleCodes && userId) {
    resolvedRoleCodes = await listUserRoleCodes(userId);
  }

  resolvedRoleCodes = resolvedRoleCodes || [];

  const [
    rolePermissionResult,
    levelPermissionResult,
    gradeOverrideResult,
    permissionCatalogResult,
  ] = await Promise.all([
    resolvedRoleCodes.length
      ? db.query(
          `
            SELECT
              p.code,
              p.name,
              p.description,
              p.permission_group,
              p.level_grade_policy_eligible,
              array_agg(DISTINCT r.code ORDER BY r.code) AS role_codes
            FROM roles r
            JOIN role_permissions rp ON rp.role_id = r.id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE r.code = ANY($1::text[])
              AND r.status = 'ACTIVE'
            GROUP BY
              p.id,
              p.code,
              p.name,
              p.description,
              p.permission_group,
              p.level_grade_policy_eligible
            ORDER BY p.permission_group NULLS LAST, p.code
          `,
          [resolvedRoleCodes]
        )
      : Promise.resolve({ rows: [] }),
    jobLevelId
      ? db.query(
          `
            SELECT
              p.code,
              p.name,
              p.description,
              p.permission_group
            FROM job_level_permission_grants jlp
            JOIN permissions p ON p.id = jlp.permission_id
            WHERE jlp.job_level_id = $1
              AND p.level_grade_policy_eligible = TRUE
            ORDER BY p.permission_group NULLS LAST, p.code
          `,
          [jobLevelId]
        )
      : Promise.resolve({ rows: [] }),
    jobGradeId
      ? db.query(
          `
            SELECT
              p.code,
              p.name,
              p.description,
              p.permission_group,
              jgo.override_effect
            FROM job_grade_permission_overrides jgo
            JOIN permissions p ON p.id = jgo.permission_id
            WHERE jgo.job_grade_id = $1
              AND p.level_grade_policy_eligible = TRUE
            ORDER BY p.permission_group NULLS LAST, p.code
          `,
          [jobGradeId]
        )
      : Promise.resolve({ rows: [] }),
    db.query(
      `
        SELECT
          id,
          code,
          name,
          description,
          permission_group,
          level_grade_policy_eligible
        FROM permissions
        ORDER BY permission_group NULLS LAST, code
      `
    ),
  ]);

  const roleMap = new Map(
    rolePermissionResult.rows.map((row) => [
      row.code,
      {
        roleCodes: Array.isArray(row.role_codes) ? row.role_codes : [],
      },
    ])
  );

  const levelSet = new Set(levelPermissionResult.rows.map((row) => row.code));
  const gradeMap = new Map(
    gradeOverrideResult.rows.map((row) => [row.code, row.override_effect])
  );

  const permissions = permissionCatalogResult.rows.map((permission) => {
    const roleInfo = roleMap.get(permission.code);
    const levelGranted = levelSet.has(permission.code);
    const gradeEffect = gradeMap.get(permission.code) || 'INHERIT';

    let organizationGranted = levelGranted;
    if (gradeEffect === 'GRANT') organizationGranted = true;
    if (gradeEffect === 'REVOKE') organizationGranted = false;

    const roleGranted = Boolean(roleInfo);
    const effective = roleGranted || organizationGranted;

    const sources = [];
    if (roleGranted) {
      sources.push(
        ...roleInfo.roleCodes.map((roleCode) => ({
          type: 'ROLE',
          code: roleCode,
          effect: 'GRANT',
        }))
      );
    }

    if (levelGranted) {
      sources.push({
        type: 'LEVEL',
        code: String(jobLevelId || ''),
        effect: 'GRANT',
      });
    }

    if (gradeEffect !== 'INHERIT') {
      sources.push({
        type: 'GRADE',
        code: String(jobGradeId || ''),
        effect: gradeEffect,
      });
    }

    return {
      id: String(permission.id),
      code: permission.code,
      name: permission.name,
      description: permission.description || null,
      group: permission.permission_group || 'Other',
      policyEligible: Boolean(permission.level_grade_policy_eligible),
      roleGranted,
      roleCodes: roleInfo?.roleCodes || [],
      levelGranted,
      gradeEffect,
      organizationGranted,
      effective,
      sources,
    };
  });

  return {
    roleCodes: resolvedRoleCodes,
    jobLevelId: jobLevelId ? String(jobLevelId) : null,
    jobGradeId: jobGradeId ? String(jobGradeId) : null,
    permissions,
    counts: {
      total: permissions.length,
      effective: permissions.filter((permission) => permission.effective).length,
      roleGranted: permissions.filter((permission) => permission.roleGranted).length,
      organizationGranted: permissions.filter(
        (permission) => permission.organizationGranted
      ).length,
      gradeOverrides: permissions.filter(
        (permission) => permission.gradeEffect !== 'INHERIT'
      ).length,
    },
  };
}

export async function resolveSimulationSelection({
  roleCodes = [],
  jobLevelId = null,
  jobGradeId = null,
}) {
  const requestedRoles = Array.from(
    new Set(
      (Array.isArray(roleCodes) ? roleCodes : [])
        .map((code) => String(code || '').trim())
        .filter(Boolean)
    )
  );

  if (requestedRoles.length) {
    const roleResult = await db.query(
      `
        SELECT code
        FROM roles
        WHERE code = ANY($1::text[])
          AND status = 'ACTIVE'
          AND is_assignable = TRUE
      `,
      [requestedRoles]
    );

    const found = roleResult.rows.map((row) => row.code);
    const missing = requestedRoles.filter((code) => !found.includes(code));

    if (missing.length) {
      const error = new Error(`Unknown simulation role: ${missing.join(', ')}`);
      error.statusCode = 400;
      error.code = 'PERMISSION_PREVIEW_ROLE_INVALID';
      throw error;
    }
  }

  if (jobLevelId) {
    const levelResult = await db.query(
      `
        SELECT id
        FROM job_levels
        WHERE id = $1
          AND status = 'ACTIVE'
        LIMIT 1
      `,
      [jobLevelId]
    );

    if (!levelResult.rows[0]) {
      const error = new Error('Simulation Job Level was not found.');
      error.statusCode = 404;
      error.code = 'PERMISSION_PREVIEW_LEVEL_NOT_FOUND';
      throw error;
    }
  }

  if (jobGradeId) {
    const gradeResult = await db.query(
      `
        SELECT id, job_level_id
        FROM job_grades
        WHERE id = $1
          AND status = 'ACTIVE'
        LIMIT 1
      `,
      [jobGradeId]
    );

    const grade = gradeResult.rows[0];
    if (!grade) {
      const error = new Error('Simulation Job Grade was not found.');
      error.statusCode = 404;
      error.code = 'PERMISSION_PREVIEW_GRADE_NOT_FOUND';
      throw error;
    }

    if (jobLevelId && String(grade.job_level_id) !== String(jobLevelId)) {
      const error = new Error('Selected Job Grade does not belong to the selected Job Level.');
      error.statusCode = 400;
      error.code = 'PERMISSION_PREVIEW_LEVEL_GRADE_MISMATCH';
      throw error;
    }
  }

  return {
    roleCodes: requestedRoles,
    jobLevelId: jobLevelId || null,
    jobGradeId: jobGradeId || null,
  };
}


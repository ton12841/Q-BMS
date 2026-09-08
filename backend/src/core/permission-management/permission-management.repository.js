import { db } from '../../config/database/postgres.js';

export async function listPermissionManagementCatalog() {
  const result = await db.query(`
    SELECT
      p.id,
      p.code,
      p.name,
      p.description,
      p.permission_group,
      COALESCE(p.level_grade_policy_eligible, FALSE) AS level_grade_policy_eligible,
      COUNT(DISTINCT rp.role_id)::int AS role_count,
      COUNT(DISTINCT CASE WHEN r.status = 'ACTIVE' THEN rp.role_id END)::int AS active_role_count,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'code', r.code,
            'name', r.name,
            'status', r.status,
            'category', r.role_category
          )
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'::json
      ) AS roles
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.id
    LEFT JOIN roles r ON r.id = rp.role_id
    GROUP BY p.id
    ORDER BY p.permission_group NULLS LAST, p.code
  `);

  return result.rows;
}

export async function getPermissionManagementCounts() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_permissions,
      COUNT(DISTINCT permission_group)::int AS permission_groups,
      COUNT(*) FILTER (
        WHERE COALESCE(level_grade_policy_eligible, FALSE) = TRUE
      )::int AS policy_eligible,
      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM role_permissions rp
          WHERE rp.permission_id = permissions.id
        )
      )::int AS unused_permissions
    FROM permissions
  `);

  return result.rows[0];
}

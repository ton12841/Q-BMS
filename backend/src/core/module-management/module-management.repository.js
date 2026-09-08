import { db } from '../../config/database/postgres.js';

export async function listPlatformRegistryItems() {
  const result = await db.query(`
    SELECT
      pri.id,
      pri.code,
      pri.item_type,
      pri.name,
      pri.domain,
      pri.ownership,
      pri.lifecycle_status,
      pri.availability_status,
      pri.permission_namespace,
      pri.description,
      pri.sort_order,
      pri.is_system_item,
      pri.created_at,
      pri.updated_at,

      CASE
        WHEN pri.permission_namespace IS NULL OR pri.permission_namespace = ''
          THEN 0
        ELSE (
          SELECT COUNT(*)::int
          FROM permissions p
          WHERE p.code LIKE pri.permission_namespace || '.%'
        )
      END AS namespace_permission_count

    FROM platform_registry_items pri
    ORDER BY pri.sort_order, pri.code
  `);

  return result.rows;
}

export async function getPlatformRegistryCounts() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_items,
      COUNT(*) FILTER (WHERE item_type = 'MODULE')::int AS modules,
      COUNT(*) FILTER (WHERE item_type = 'TOOL')::int AS tools,
      COUNT(*) FILTER (WHERE lifecycle_status = 'HOLD')::int AS hold_items,
      COUNT(*) FILTER (WHERE availability_status = 'CATALOG')::int AS catalog_items
    FROM platform_registry_items
  `);

  return result.rows[0];
}

import { db } from '../../config/database/postgres.js';

export async function listSystemConfigurationRegistry() {
  const result = await db.query(`
    SELECT
      id,
      config_key,
      config_group,
      value_type,
      value_json,
      name,
      description,
      source_of_truth,
      mutability,
      status,
      sort_order,
      created_at,
      updated_at
    FROM system_configuration_registry
    ORDER BY config_group, sort_order, config_key
  `);

  return result.rows;
}

export async function getSystemConfigurationCounts() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_settings,
      COUNT(DISTINCT config_group)::int AS groups,
      COUNT(*) FILTER (WHERE mutability = 'LOCKED')::int AS locked_settings,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_settings
    FROM system_configuration_registry
  `);

  return result.rows[0];
}

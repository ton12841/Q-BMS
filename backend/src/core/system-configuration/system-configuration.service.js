import {
  getSystemConfigurationCounts,
  listSystemConfigurationRegistry,
} from './system-configuration.repository.js';

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapSetting(row) {
  return {
    id: String(row.id),
    key: row.config_key,
    group: row.config_group,
    valueType: row.value_type,
    value: row.value_json,
    name: row.name,
    description: row.description || null,
    sourceOfTruth: row.source_of_truth,
    mutability: row.mutability,
    status: row.status,
    sortOrder: Number(row.sort_order || 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function getSystemConfigurationOverview() {
  const [counts, settings] = await Promise.all([
    getSystemConfigurationCounts(),
    listSystemConfigurationRegistry(),
  ]);

  return {
    counts: {
      totalSettings: Number(counts.total_settings || 0),
      groups: Number(counts.groups || 0),
      lockedSettings: Number(counts.locked_settings || 0),
      activeSettings: Number(counts.active_settings || 0),
    },
    settings: settings.map(mapSetting),
    mode: 'READ_ONLY_FOUNDATION',
    rules: {
      canonicalRegistry: true,
      mutationDisabled: true,
      approvalFlowRequiredBeforeMutation: true,
      auditRequiredBeforeMutation: true,
      secretsExcluded: true,
      runtimeEnvironmentValuesExcluded: true,
    },
  };
}

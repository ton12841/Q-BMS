import {
  getPlatformRegistryCounts,
  listPlatformRegistryItems,
} from './module-management.repository.js';

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapItem(row) {
  return {
    id: String(row.id),
    code: row.code,
    type: row.item_type,
    name: row.name,
    domain: row.domain,
    ownership: row.ownership,
    lifecycleStatus: row.lifecycle_status,
    availabilityStatus: row.availability_status,
    permissionNamespace: row.permission_namespace || null,
    namespacePermissionCount: Number(row.namespace_permission_count || 0),
    description: row.description || null,
    sortOrder: Number(row.sort_order || 0),
    isSystemItem: Boolean(row.is_system_item),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function getModuleManagementOverview() {
  const [counts, items] = await Promise.all([
    getPlatformRegistryCounts(),
    listPlatformRegistryItems(),
  ]);

  return {
    counts: {
      totalItems: Number(counts.total_items || 0),
      modules: Number(counts.modules || 0),
      tools: Number(counts.tools || 0),
      holdItems: Number(counts.hold_items || 0),
      catalogItems: Number(counts.catalog_items || 0),
    },
    items: items.map(mapItem),
    mode: 'READ_ONLY_FOUNDATION',
    rules: {
      registryIsSourceOfTruth: true,
      enableDisableDisabled: true,
      lifecycleMutationDisabled: true,
      routeMutationDisabled: true,
      permissionRegistrationDisabled: true,
      crmHoldPreserved: true,
      expectedModuleCount: 10,
      expectedToolCount: 9,
    },
  };
}

import {
  getAuditLogFilterOptions,
  listAuditLogs,
} from './audit-log.repository.js';

const SENSITIVE_KEY_PATTERN =
  /(password|passcode|secret|token|credential|authorization|cookie|session[_-]?id|private[_-]?key|api[_-]?key|otp|verification[_-]?code)/i;

function sanitizeMetadata(value, depth = 0) {
  if (depth > 8) {
    return '[MAX_DEPTH]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key)
          ? '[REDACTED]'
          : sanitizeMetadata(child, depth + 1),
      ])
    );
  }

  return value;
}

function iso(value) {
  return value ? new Date(value).toISOString() : null;
}

function actorDisplayName(row) {
  return (
    [row.actor_first_name, row.actor_last_name]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    row.actor_nickname ||
    row.actor_email ||
    (row.actor_user_id ? `User ${row.actor_user_id}` : 'System')
  );
}

function mapRow(row) {
  return {
    id: String(row.id),
    action: row.action,
    entityType: row.entity_type || null,
    entityId: row.entity_id || null,
    createdAt: iso(row.created_at),
    actor: row.actor_user_id
      ? {
          userId: String(row.actor_user_id),
          employeeCode: row.actor_employee_code || null,
          email: row.actor_email || null,
          displayName: actorDisplayName(row),
          accountStatus: row.actor_account_status || null,
        }
      : {
          userId: null,
          employeeCode: null,
          email: null,
          displayName: 'System',
          accountStatus: null,
        },
    metadata: sanitizeMetadata(row.metadata ?? null),
  };
}

export async function getAuditLogOverview(filters = {}) {
  const [pageData, options] = await Promise.all([
    listAuditLogs(filters),
    getAuditLogFilterOptions(),
  ]);

  const pageCount = Math.max(
    1,
    Math.ceil(pageData.total / pageData.pageSize)
  );

  return {
    counts: {
      total: Number(options.counts.total || 0),
      today: Number(options.counts.today || 0),
      last24Hours: Number(options.counts.last_24_hours || 0),
      uniqueActors: Number(options.counts.unique_actors || 0),
    },
    filters: {
      actions: options.actions.map((row) => ({
        value: row.action,
        count: Number(row.count || 0),
      })),
      entityTypes: options.entityTypes.map((row) => ({
        value: row.entity_type,
        count: Number(row.count || 0),
      })),
      actors: options.actors.map((row) => ({
        userId: String(row.id),
        email: row.email || null,
        employeeCode: row.employee_code || null,
        displayName:
          [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
          row.nickname ||
          row.email ||
          `User ${row.id}`,
        auditCount: Number(row.audit_count || 0),
      })),
    },
    pagination: {
      page: pageData.page,
      pageSize: pageData.pageSize,
      total: pageData.total,
      pageCount,
      hasPrevious: pageData.page > 1,
      hasNext: pageData.page < pageCount,
    },
    logs: pageData.rows.map(mapRow),
    mode: 'READ_ONLY',
    security: {
      metadataSanitized: true,
      sensitiveFieldsRedacted: true,
    },
  };
}

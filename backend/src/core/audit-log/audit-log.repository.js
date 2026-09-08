import { db } from '../../config/database/postgres.js';

function normalizeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function buildFilters(filters = {}) {
  const where = [];
  const values = [];

  function add(value) {
    values.push(value);
    return `$${values.length}`;
  }

  const query = String(filters.query || '').trim();
  const action = String(filters.action || '').trim();
  const entityType = String(filters.entityType || '').trim();
  const actorUserId = String(filters.actorUserId || '').trim();
  const from = String(filters.from || '').trim();
  const to = String(filters.to || '').trim();

  if (query) {
    const ref = add(`%${query}%`);
    where.push(`
      (
        al.action ILIKE ${ref}
        OR COALESCE(al.entity_type, '') ILIKE ${ref}
        OR COALESCE(al.entity_id, '') ILIKE ${ref}
        OR COALESCE(u.email, '') ILIKE ${ref}
        OR COALESCE(e.employee_code, '') ILIKE ${ref}
        OR COALESCE(e.first_name, '') ILIKE ${ref}
        OR COALESCE(e.last_name, '') ILIKE ${ref}
        OR COALESCE(e.nickname, '') ILIKE ${ref}
      )
    `);
  }

  if (action) {
    where.push(`al.action = ${add(action)}`);
  }

  if (entityType) {
    where.push(`al.entity_type = ${add(entityType)}`);
  }

  if (actorUserId) {
    where.push(`al.actor_user_id = ${add(actorUserId)}`);
  }

  if (from) {
    where.push(`al.created_at >= ${add(from)}::timestamptz`);
  }

  if (to) {
    where.push(`al.created_at <= ${add(to)}::timestamptz`);
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    values,
  };
}

export async function listAuditLogs(filters = {}) {
  const page = normalizeInteger(filters.page, 1, 1, 1000000);
  const pageSize = normalizeInteger(filters.pageSize, 50, 10, 100);
  const offset = (page - 1) * pageSize;

  const filter = buildFilters(filters);

  const countResult = await db.query(
    `
      SELECT COUNT(*)::int AS total
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      LEFT JOIN employees e ON e.id = u.employee_id
      ${filter.clause}
    `,
    filter.values
  );

  const values = [...filter.values, pageSize, offset];
  const limitRef = `$${values.length - 1}`;
  const offsetRef = `$${values.length}`;

  const result = await db.query(
    `
      SELECT
        al.id,
        al.actor_user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.created_at,

        u.email AS actor_email,
        u.account_status AS actor_account_status,
        e.employee_code AS actor_employee_code,
        e.first_name AS actor_first_name,
        e.last_name AS actor_last_name,
        e.nickname AS actor_nickname

      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_user_id
      LEFT JOIN employees e ON e.id = u.employee_id
      ${filter.clause}
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT ${limitRef}
      OFFSET ${offsetRef}
    `,
    values
  );

  return {
    rows: result.rows,
    total: Number(countResult.rows[0]?.total || 0),
    page,
    pageSize,
  };
}

export async function getAuditLogFilterOptions() {
  const [actionResult, entityResult, actorResult, countResult] = await Promise.all([
    db.query(`
      SELECT action, COUNT(*)::int AS count
      FROM audit_logs
      GROUP BY action
      ORDER BY action
    `),
    db.query(`
      SELECT entity_type, COUNT(*)::int AS count
      FROM audit_logs
      WHERE entity_type IS NOT NULL
        AND entity_type <> ''
      GROUP BY entity_type
      ORDER BY entity_type
    `),
    db.query(`
      SELECT
        u.id,
        u.email,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname,
        COUNT(al.id)::int AS audit_count
      FROM audit_logs al
      JOIN users u ON u.id = al.actor_user_id
      LEFT JOIN employees e ON e.id = u.employee_id
      GROUP BY
        u.id,
        u.email,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname
      ORDER BY
        COALESCE(e.first_name, ''),
        COALESCE(e.last_name, ''),
        u.email
    `),
    db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        )::int AS last_24_hours,
        COUNT(*) FILTER (
          WHERE created_at >= DATE_TRUNC('day', NOW())
        )::int AS today,
        COUNT(DISTINCT actor_user_id) FILTER (
          WHERE actor_user_id IS NOT NULL
        )::int AS unique_actors
      FROM audit_logs
    `),
  ]);

  return {
    actions: actionResult.rows,
    entityTypes: entityResult.rows,
    actors: actorResult.rows,
    counts: countResult.rows[0],
  };
}

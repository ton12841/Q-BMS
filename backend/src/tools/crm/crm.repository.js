import { db } from '../../config/database/postgres.js';

const LEAD_SELECT = `
  SELECT
    l.id,
    l.lead_code,
    l.business_unit_id,
    bu.code AS business_unit_code,
    bu.name AS business_unit_name,
    l.owner_user_id,
    l.store_name,
    l.legal_company_name,
    l.individual_name,
    l.primary_contact,
    l.phone,
    l.email,
    l.whatsapp,
    l.province,
    l.source,
    l.source_detail,
    l.project_name,
    l.campaign_name,
    l.note,
    l.status,
    l.lost_reason,
    l.created_by_user_id,
    l.updated_by_user_id,
    l.created_at,
    l.updated_at,
    u.email AS owner_email,
    e.employee_code AS owner_employee_code,
    e.first_name AS owner_first_name,
    e.last_name AS owner_last_name,
    e.nickname AS owner_nickname
  FROM crm_leads l
  JOIN business_units bu ON bu.id = l.business_unit_id
  LEFT JOIN users u ON u.id = l.owner_user_id
  LEFT JOIN employees e ON e.id = u.employee_id
`;

export async function listAllActiveBusinessUnits() {
  const result = await db.query(`
    SELECT id, code, name, status, sort_order
    FROM business_units
    WHERE status = 'ACTIVE'
    ORDER BY sort_order, code
  `);
  return result.rows;
}

export async function listEmployeeBusinessUnits(employeeId) {
  if (!employeeId) return [];

  const result = await db.query(
    `
      SELECT DISTINCT bu.id, bu.code, bu.name, bu.status, bu.sort_order
      FROM business_units bu
      WHERE bu.status = 'ACTIVE'
        AND (
          bu.id IN (
            SELECT ebu.business_unit_id
            FROM employee_business_units ebu
            WHERE ebu.employee_id = $1
          )
          OR bu.id = (
            SELECT e.primary_business_unit_id
            FROM employees e
            WHERE e.id = $1
          )
        )
      ORDER BY bu.sort_order, bu.code
    `,
    [employeeId]
  );

  return result.rows;
}

export async function findActiveBusinessUnitByCode(code) {
  const result = await db.query(
    `
      SELECT id, code, name, status, sort_order
      FROM business_units
      WHERE UPPER(code) = UPPER($1)
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [code]
  );
  return result.rows[0] || null;
}

function ownerName(row) {
  const fullName = [row.owner_first_name, row.owner_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return row.owner_nickname || fullName || row.owner_email || null;
}

export function mapLeadRow(row) {
  return {
    ...row,
    owner_display_name: ownerName(row),
  };
}

export async function listLeads({
  businessUnitCode = 'ALL',
  query = '',
  ownerUserId = null,
  viewAllOwners = false,
}) {
  const where = [];
  const values = [];

  function add(value) {
    values.push(value);
    return `$${values.length}`;
  }

  if (businessUnitCode && businessUnitCode !== 'ALL') {
    where.push(`UPPER(bu.code) = UPPER(${add(businessUnitCode)})`);
  }

  if (!viewAllOwners) {
    if (!ownerUserId) return [];
    where.push(`l.owner_user_id = ${add(ownerUserId)}`);
  }

  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery) {
    const ref = add(`%${normalizedQuery}%`);
    where.push(`(
      l.lead_code ILIKE ${ref}
      OR l.store_name ILIKE ${ref}
      OR COALESCE(l.legal_company_name, '') ILIKE ${ref}
      OR COALESCE(l.individual_name, '') ILIKE ${ref}
      OR l.primary_contact ILIKE ${ref}
      OR l.phone ILIKE ${ref}
      OR COALESCE(l.email, '') ILIKE ${ref}
      OR COALESCE(l.whatsapp, '') ILIKE ${ref}
      OR l.province ILIKE ${ref}
      OR COALESCE(u.email, '') ILIKE ${ref}
      OR COALESCE(e.first_name, '') ILIKE ${ref}
      OR COALESCE(e.last_name, '') ILIKE ${ref}
      OR COALESCE(e.nickname, '') ILIKE ${ref}
    )`);
  }

  const result = await db.query(
    `${LEAD_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY l.updated_at DESC, l.id DESC
     LIMIT 500`,
    values
  );

  return result.rows.map(mapLeadRow);
}

export async function findLeadByCode({
  leadCode,
  ownerUserId = null,
  viewAllOwners = false,
}) {
  const values = [leadCode];
  let ownerClause = '';

  if (!viewAllOwners) {
    if (!ownerUserId) return null;
    values.push(ownerUserId);
    ownerClause = `AND l.owner_user_id = $2`;
  }

  const result = await db.query(
    `${LEAD_SELECT}
     WHERE l.lead_code = $1
     ${ownerClause}
     LIMIT 1`,
    values
  );

  return result.rows[0] ? mapLeadRow(result.rows[0]) : null;
}

export async function findPotentialDuplicateLeads({ businessUnitId, phone }) {
  const normalizedPhone = String(phone || '').replace(/[^0-9]+/g, '');
  if (!normalizedPhone) return [];

  const result = await db.query(
    `${LEAD_SELECT}
     WHERE l.business_unit_id = $1
       AND regexp_replace(l.phone, '[^0-9]+', '', 'g') = $2
     ORDER BY l.updated_at DESC, l.id DESC
     LIMIT 5`,
    [businessUnitId, normalizedPhone]
  );

  return result.rows.map(mapLeadRow);
}

export async function createLeadRecord({
  businessUnitId,
  ownerUserId,
  payload,
  actorUserId,
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
        INSERT INTO crm_leads (
          business_unit_id,
          owner_user_id,
          store_name,
          legal_company_name,
          individual_name,
          primary_contact,
          phone,
          email,
          whatsapp,
          province,
          source,
          source_detail,
          project_name,
          campaign_name,
          note,
          status,
          created_by_user_id,
          updated_by_user_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $17
        )
        RETURNING lead_code
      `,
      [
        businessUnitId,
        ownerUserId,
        payload.storeName,
        payload.legalCompanyName,
        payload.individualName,
        payload.primaryContact,
        payload.phone,
        payload.email,
        payload.whatsapp,
        payload.province,
        payload.source,
        payload.sourceDetail,
        payload.project,
        payload.campaign,
        payload.note,
        payload.status,
        actorUserId,
      ]
    );

    const leadCode = result.rows[0].lead_code;

    await client.query(
      `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id,
          metadata
        )
        VALUES ($1, 'CRM_LEAD_CREATED', 'CRM_LEAD', $2, $3::jsonb)
      `,
      [
        actorUserId,
        leadCode,
        JSON.stringify({
          businessUnitId: String(businessUnitId),
          source: payload.source,
          status: payload.status,
        }),
      ]
    );

    await client.query('COMMIT');
    return leadCode;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

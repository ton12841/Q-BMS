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
    e.nickname AS owner_nickname,
    next_activity.activity_type AS next_activity_type,
    next_activity.scheduled_at AS next_activity_at
  FROM crm_leads l
  JOIN business_units bu ON bu.id = l.business_unit_id
  LEFT JOIN users u ON u.id = l.owner_user_id
  LEFT JOIN employees e ON e.id = u.employee_id
  LEFT JOIN LATERAL (
    SELECT a.activity_type, a.scheduled_at
    FROM crm_activities a
    WHERE a.lead_id = l.id
      AND a.status IN ('SCHEDULED', 'RESCHEDULED')
    ORDER BY a.scheduled_at ASC, a.id ASC
    LIMIT 1
  ) next_activity ON TRUE
`;

const DEAL_SELECT = `
  SELECT
    d.id,
    d.deal_code,
    d.business_unit_id,
    bu.code AS business_unit_code,
    bu.name AS business_unit_name,
    d.source_lead_id,
    sl.lead_code AS source_lead_code,
    d.owner_user_id,
    d.store_name,
    d.primary_contact,
    d.customer_id,
    cm.customer_code,
    cm.display_name AS customer_name,
    d.customer_linked_at,
    d.stage,
    d.value,
    d.currency,
    d.expected_close_date,
    d.package_code,
    d.license_quantity,
    d.software_value,
    d.hardware_value,
    d.product_note,
    d.closed_won_at,
    d.closed_lost_at,
    d.lost_reason,
    d.quotation_number,
    d.quotation_confirmed_at,
    d.payment_slip_uploaded_at,
    d.finance_payment_confirmed_at,
    d.invoice_number,
    d.invoice_received_at,
    product_lines.product_lines,
    recognition.point_recognition,
    d.created_by_user_id,
    d.updated_by_user_id,
    d.created_at,
    d.updated_at,
    u.email AS owner_email,
    e.employee_code AS owner_employee_code,
    e.first_name AS owner_first_name,
    e.last_name AS owner_last_name,
    e.nickname AS owner_nickname,
    next_activity.activity_type AS next_activity_type,
    next_activity.scheduled_at AS next_activity_at
  FROM crm_deals d
  JOIN business_units bu ON bu.id = d.business_unit_id
  LEFT JOIN crm_leads sl ON sl.id = d.source_lead_id
  LEFT JOIN customer_master cm ON cm.id = d.customer_id
  LEFT JOIN users u ON u.id = d.owner_user_id
  LEFT JOIN employees e ON e.id = u.employee_id
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', pl.id::text,
          'productCode', pl.product_code,
          'productName', pl.product_name_snapshot,
          'pointType', pl.point_type_snapshot,
          'unitLabel', pl.unit_label_snapshot,
          'inventoryManaged', pl.inventory_managed_snapshot,
          'quantity', pl.quantity,
          'unitPrice', pl.unit_price,
          'lineValue', pl.line_value
        ) ORDER BY pl.sort_order, pl.id
      ), '[]'::jsonb
    ) AS product_lines
    FROM crm_deal_product_lines pl
    WHERE pl.deal_id = d.id
  ) product_lines ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_build_object(
      'recognizedAt', r.recognized_at,
      'period', to_char(r.period_month, 'YYYY-MM'),
      'swPoints', r.sw_points,
      'hwPoints', r.hw_points,
      'amountLAK', r.commission_amount_lak,
      'commissionPlanName', r.commission_plan_name_snapshot,
      'lineSnapshots', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'productCode', rl.product_code,
          'productName', rl.product_name_snapshot,
          'pointType', rl.point_type_snapshot,
          'quantity', rl.quantity,
          'pointsPerUnit', rl.points_per_unit,
          'totalPoints', rl.total_points
        ) ORDER BY rl.id)
        FROM crm_point_recognition_lines rl
        WHERE rl.recognition_id = r.id
      ), '[]'::jsonb)
    ) AS point_recognition
    FROM crm_point_recognitions r
    WHERE r.deal_id = d.id
    LIMIT 1
  ) recognition ON TRUE
  LEFT JOIN LATERAL (
    SELECT a.activity_type, a.scheduled_at
    FROM crm_activities a
    WHERE a.deal_id = d.id
      AND a.status IN ('SCHEDULED', 'RESCHEDULED')
    ORDER BY a.scheduled_at ASC, a.id ASC
    LIMIT 1
  ) next_activity ON TRUE
`;

const ACTIVITY_SELECT = `
  SELECT
    a.id,
    a.activity_code,
    a.business_unit_id,
    bu.code AS business_unit_code,
    bu.name AS business_unit_name,
    a.lead_id,
    l.lead_code,
    a.deal_id,
    d.deal_code,
    COALESCE(l.store_name, d.store_name) AS store_name,
    COALESCE(l.primary_contact, d.primary_contact) AS primary_contact,
    a.owner_user_id,
    a.parent_activity_id,
    a.activity_type,
    a.subject,
    a.purpose_code,
    a.purpose_detail,
    a.purpose_note,
    a.scheduled_at,
    a.status,
    a.outcome,
    a.result_note,
    a.reschedule_reason,
    a.completed_at,
    a.created_at,
    a.updated_at,
    u.email AS owner_email,
    e.employee_code AS owner_employee_code,
    e.first_name AS owner_first_name,
    e.last_name AS owner_last_name,
    e.nickname AS owner_nickname
  FROM crm_activities a
  JOIN business_units bu ON bu.id = a.business_unit_id
  LEFT JOIN crm_leads l ON l.id = a.lead_id
  LEFT JOIN crm_deals d ON d.id = a.deal_id
  LEFT JOIN users u ON u.id = a.owner_user_id
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
  return { ...row, owner_display_name: ownerName(row) };
}

export function mapDealRow(row) {
  return { ...row, owner_display_name: ownerName(row) };
}

export function mapActivityRow(row) {
  return { ...row, owner_display_name: ownerName(row) };
}

function buildOwnerClause({ alias, ownerUserId, ownerUserIds = null, viewAllOwners, values }) {
  if (viewAllOwners) return null;
  if (Array.isArray(ownerUserIds)) {
    const normalized = [...new Set(ownerUserIds.map((value) => String(value)).filter(Boolean))];
    if (!normalized.length) return '__NO_ACCESS__';
    values.push(normalized);
    return `${alias}.owner_user_id = ANY($${values.length}::bigint[])`;
  }
  if (!ownerUserId) return '__NO_ACCESS__';
  values.push(ownerUserId);
  return `${alias}.owner_user_id = $${values.length}`;
}

export async function listLeads({ businessUnitCode = 'ALL', query = '', ownerUserId = null, ownerUserIds = null, viewAllOwners = false }) {
  const where = [];
  const values = [];
  const add = (value) => { values.push(value); return `$${values.length}`; };

  if (businessUnitCode && businessUnitCode !== 'ALL') where.push(`UPPER(bu.code) = UPPER(${add(businessUnitCode)})`);
  const ownerClause = buildOwnerClause({ alias: 'l', ownerUserId, ownerUserIds, viewAllOwners, values });
  if (ownerClause === '__NO_ACCESS__') return [];
  if (ownerClause) where.push(ownerClause);

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

export async function findLeadByCode({ leadCode, ownerUserId = null, viewAllOwners = false }) {
  const values = [leadCode];
  let ownerClause = '';
  if (!viewAllOwners) {
    if (!ownerUserId) return null;
    values.push(ownerUserId);
    ownerClause = 'AND l.owner_user_id = $2';
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

export async function createLeadRecord({ businessUnitId, ownerUserId, payload, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `
        INSERT INTO crm_leads (
          business_unit_id, owner_user_id, store_name, legal_company_name,
          individual_name, primary_contact, phone, email, whatsapp, province,
          source, source_detail, project_name, campaign_name, note, status,
          created_by_user_id, updated_by_user_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $17
        )
        RETURNING lead_code
      `,
      [
        businessUnitId, ownerUserId, payload.storeName, payload.legalCompanyName,
        payload.individualName, payload.primaryContact, payload.phone, payload.email,
        payload.whatsapp, payload.province, payload.source, payload.sourceDetail,
        payload.project, payload.campaign, payload.note, payload.status, actorUserId,
      ]
    );
    const leadCode = result.rows[0].lead_code;
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_LEAD_CREATED', 'CRM_LEAD', $2, $3::jsonb)`,
      [actorUserId, leadCode, JSON.stringify({ businessUnitId: String(businessUnitId), source: payload.source, status: payload.status })]
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


export async function assignLeadOwnerRecord({ leadId, ownerUserId = null, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT id, lead_code, business_unit_id, owner_user_id, status
       FROM crm_leads
       WHERE id = $1
       FOR UPDATE`,
      [leadId]
    );
    const lead = current.rows[0];
    if (!lead) {
      const error = new Error('CRM Lead no longer exists.');
      error.code = 'CRM_LEAD_NOT_FOUND';
      throw error;
    }
    if (['CONVERTED', 'LOST'].includes(lead.status)) {
      const error = new Error('Closed or converted Lead cannot be reassigned.');
      error.code = 'CRM_LEAD_ASSIGNMENT_LOCKED';
      throw error;
    }

    const nextStatus = ownerUserId
      ? (['UNASSIGNED', 'NEW'].includes(lead.status) ? 'ASSIGNED' : lead.status)
      : 'UNASSIGNED';

    await client.query(
      `UPDATE crm_leads
       SET owner_user_id = $2,
           status = $3,
           updated_by_user_id = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [leadId, ownerUserId, nextStatus, actorUserId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_LEAD_OWNER_ASSIGNED', 'CRM_LEAD', $2, $3::jsonb)`,
      [actorUserId, lead.lead_code, JSON.stringify({
        businessUnitId: String(lead.business_unit_id),
        previousOwnerUserId: lead.owner_user_id ? String(lead.owner_user_id) : null,
        ownerUserId: ownerUserId ? String(ownerUserId) : null,
        status: nextStatus,
      })]
    );

    await client.query('COMMIT');
    return lead.lead_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listDeals({ businessUnitCode = 'ALL', query = '', ownerUserId = null, ownerUserIds = null, viewAllOwners = false }) {
  const where = [];
  const values = [];
  const add = (value) => { values.push(value); return `$${values.length}`; };
  if (businessUnitCode && businessUnitCode !== 'ALL') where.push(`UPPER(bu.code) = UPPER(${add(businessUnitCode)})`);
  const ownerClause = buildOwnerClause({ alias: 'd', ownerUserId, ownerUserIds, viewAllOwners, values });
  if (ownerClause === '__NO_ACCESS__') return [];
  if (ownerClause) where.push(ownerClause);
  const normalizedQuery = String(query || '').trim();
  if (normalizedQuery) {
    const ref = add(`%${normalizedQuery}%`);
    where.push(`(
      d.deal_code ILIKE ${ref}
      OR d.store_name ILIKE ${ref}
      OR COALESCE(d.primary_contact, '') ILIKE ${ref}
      OR COALESCE(sl.lead_code, '') ILIKE ${ref}
      OR COALESCE(d.quotation_number, '') ILIKE ${ref}
      OR COALESCE(u.email, '') ILIKE ${ref}
      OR COALESCE(e.first_name, '') ILIKE ${ref}
      OR COALESCE(e.last_name, '') ILIKE ${ref}
      OR COALESCE(e.nickname, '') ILIKE ${ref}
    )`);
  }
  const result = await db.query(
    `${DEAL_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY d.updated_at DESC, d.id DESC
     LIMIT 500`,
    values
  );
  return result.rows.map(mapDealRow);
}

export async function findDealByCode({ dealCode, ownerUserId = null, viewAllOwners = false }) {
  const values = [dealCode];
  let ownerClause = '';
  if (!viewAllOwners) {
    if (!ownerUserId) return null;
    values.push(ownerUserId);
    ownerClause = 'AND d.owner_user_id = $2';
  }
  const result = await db.query(
    `${DEAL_SELECT}
     WHERE d.deal_code = $1
     ${ownerClause}
     LIMIT 1`,
    values
  );
  return result.rows[0] ? mapDealRow(result.rows[0]) : null;
}

export async function createDealFromLeadRecord({ lead, payload, productLines, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT id, lead_code, status FROM crm_leads WHERE id = $1 FOR UPDATE`,
      [lead.id]
    );
    if (!current.rows[0]) {
      const error = new Error('Lead no longer exists.');
      error.code = 'CRM_LEAD_NOT_FOUND';
      throw error;
    }
    if (current.rows[0].status === 'CONVERTED') {
      const error = new Error('Lead is already converted to a Deal.');
      error.code = 'CRM_LEAD_ALREADY_CONVERTED';
      throw error;
    }
    if (current.rows[0].status === 'LOST') {
      const error = new Error('Lost Lead cannot be converted to a Deal.');
      error.code = 'CRM_LEAD_LOST';
      throw error;
    }

    const result = await client.query(
      `
        INSERT INTO crm_deals (
          business_unit_id, source_lead_id, owner_user_id, store_name,
          primary_contact, stage, value, currency, expected_close_date,
          package_code, license_quantity, software_value, hardware_value, product_note,
          created_by_user_id, updated_by_user_id
        )
        VALUES ($1, $2, $3, $4, $5, 'NEW_DEAL', $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
        RETURNING id, deal_code
      `,
      [
        lead.business_unit_id,
        lead.id,
        lead.owner_user_id || actorUserId,
        lead.store_name,
        lead.primary_contact,
        payload.value,
        payload.currency,
        payload.expectedCloseDate,
        payload.packageCode,
        payload.licenseQuantity,
        payload.softwareValue,
        payload.hardwareValue,
        payload.productNote,
        actorUserId,
      ]
    );
    const deal = result.rows[0];

    for (let index = 0; index < productLines.length; index += 1) {
      const line = productLines[index];
      await client.query(
        `INSERT INTO crm_deal_product_lines (
           deal_id, business_unit_id, product_code, product_name_snapshot, point_type_snapshot,
           unit_label_snapshot, inventory_managed_snapshot, quantity, unit_price, line_value,
           sort_order, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          deal.id, lead.business_unit_id, line.productCode, line.productName, line.pointType,
          line.unitLabel, line.inventoryManaged, line.quantity, line.unitPrice, line.lineValue,
          index + 1, actorUserId,
        ]
      );
    }

    await client.query(
      `INSERT INTO crm_commissions (deal_id, business_unit_id, owner_user_id, status)
       VALUES ($1, $2, $3, 'PROJECTED')
       ON CONFLICT (deal_id) DO NOTHING`,
      [deal.id, lead.business_unit_id, lead.owner_user_id || actorUserId]
    );

    await client.query(
      `UPDATE crm_leads
       SET status = 'CONVERTED', updated_by_user_id = $2, updated_at = NOW()
       WHERE id = $1`,
      [lead.id, actorUserId]
    );

    // Preserve active work continuity: future/incomplete Lead Activities become Deal Activities.
    await client.query(
      `UPDATE crm_activities
       SET deal_id = $2,
           lead_id = NULL,
           updated_by_user_id = $3,
           updated_at = NOW()
       WHERE lead_id = $1
         AND status IN ('SCHEDULED', 'RESCHEDULED')`,
      [lead.id, deal.id, actorUserId]
    );

    await client.query(
      `INSERT INTO crm_deal_stage_history (deal_id, from_stage, to_stage, reason, actor_user_id)
       VALUES ($1, NULL, 'NEW_DEAL', 'Lead converted to Deal', $2)`,
      [deal.id, actorUserId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_LEAD_CONVERTED_TO_DEAL', 'CRM_DEAL', $2, $3::jsonb)`,
      [actorUserId, deal.deal_code, JSON.stringify({ leadCode: lead.lead_code, businessUnitId: String(lead.business_unit_id) })]
    );

    await client.query('COMMIT');
    return deal.deal_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateDealStageRecord({ deal, toStage, reason, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE crm_deals
       SET stage = $2,
           lost_reason = CASE WHEN $2 = 'CLOSED_LOST' THEN $3 ELSE NULL END,
           closed_lost_at = CASE WHEN $2 = 'CLOSED_LOST' THEN NOW() ELSE closed_lost_at END,
           closed_won_at = CASE WHEN $2 = 'CLOSED_WON' THEN NOW() ELSE closed_won_at END,
           updated_by_user_id = $4,
           updated_at = NOW()
       WHERE id = $1
       RETURNING deal_code`,
      [deal.id, toStage, reason, actorUserId]
    );
    await client.query(
      `UPDATE crm_commissions
       SET status = CASE
             WHEN $2 = 'CLOSED_LOST' THEN 'VOID'
             WHEN $2 = 'CLOSED_WON' AND status = 'PROJECTED' THEN 'PENDING'
             ELSE status
           END,
           updated_at = NOW()
       WHERE deal_id = $1`,
      [deal.id, toStage]
    );
    await client.query(
      `INSERT INTO crm_deal_stage_history (deal_id, from_stage, to_stage, reason, actor_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [deal.id, deal.stage, toStage, reason, actorUserId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_DEAL_STAGE_CHANGED', 'CRM_DEAL', $2, $3::jsonb)`,
      [actorUserId, result.rows[0].deal_code, JSON.stringify({ from: deal.stage, to: toStage, reason: reason || null })]
    );
    await client.query('COMMIT');
    return result.rows[0].deal_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listActivities({ businessUnitCode = 'ALL', leadCode = null, dealCode = null, ownerUserId = null, ownerUserIds = null, viewAllOwners = false }) {
  const where = [];
  const values = [];
  const add = (value) => { values.push(value); return `$${values.length}`; };
  if (businessUnitCode && businessUnitCode !== 'ALL') where.push(`UPPER(bu.code) = UPPER(${add(businessUnitCode)})`);
  if (leadCode) where.push(`l.lead_code = ${add(leadCode)}`);
  if (dealCode) where.push(`d.deal_code = ${add(dealCode)}`);
  const ownerClause = buildOwnerClause({ alias: 'a', ownerUserId, ownerUserIds, viewAllOwners, values });
  if (ownerClause === '__NO_ACCESS__') return [];
  if (ownerClause) where.push(ownerClause);

  const result = await db.query(
    `${ACTIVITY_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY
       CASE WHEN a.status IN ('SCHEDULED', 'RESCHEDULED') THEN 0 ELSE 1 END,
       CASE WHEN a.status IN ('SCHEDULED', 'RESCHEDULED') THEN a.scheduled_at END ASC,
       a.updated_at DESC,
       a.id DESC
     LIMIT 1000`,
    values
  );
  return result.rows.map(mapActivityRow);
}

export async function findActivityByCode({ activityCode, ownerUserId = null, viewAllOwners = false }) {
  const values = [activityCode];
  let ownerClause = '';
  if (!viewAllOwners) {
    if (!ownerUserId) return null;
    values.push(ownerUserId);
    ownerClause = 'AND a.owner_user_id = $2';
  }
  const result = await db.query(
    `${ACTIVITY_SELECT}
     WHERE a.activity_code = $1
     ${ownerClause}
     LIMIT 1`,
    values
  );
  return result.rows[0] ? mapActivityRow(result.rows[0]) : null;
}

async function insertActivityWithClient(client, {
  businessUnitId,
  leadId = null,
  dealId = null,
  ownerUserId,
  parentActivityId = null,
  payload,
  actorUserId,
}) {
  const result = await client.query(
    `
      INSERT INTO crm_activities (
        business_unit_id, lead_id, deal_id, owner_user_id, parent_activity_id,
        activity_type, subject, purpose_code, purpose_detail, purpose_note,
        scheduled_at, status, created_by_user_id, updated_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SCHEDULED', $12, $12)
      RETURNING id, activity_code
    `,
    [
      businessUnitId, leadId, dealId, ownerUserId, parentActivityId,
      payload.type, payload.subject, payload.purposeCode, payload.purposeDetail,
      payload.note, payload.scheduledAt, actorUserId,
    ]
  );
  const activity = result.rows[0];
  await client.query(
    `INSERT INTO crm_activity_history (activity_id, event_type, to_scheduled_at, note, actor_user_id)
     VALUES ($1, 'CREATED', $2, $3, $4)`,
    [activity.id, payload.scheduledAt, payload.note, actorUserId]
  );
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'CRM_ACTIVITY_CREATED', 'CRM_ACTIVITY', $2, $3::jsonb)`,
    [
      actorUserId,
      activity.activity_code,
      JSON.stringify({
        leadId: leadId ? String(leadId) : null,
        dealId: dealId ? String(dealId) : null,
        businessUnitId: String(businessUnitId),
        type: payload.type,
        purposeCode: payload.purposeCode,
        scheduledAt: payload.scheduledAt,
      }),
    ]
  );
  return activity;
}

export async function createActivityRecord({ businessUnitId, leadId = null, dealId = null, ownerUserId, payload, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const activity = await insertActivityWithClient(client, { businessUnitId, leadId, dealId, ownerUserId, payload, actorUserId });
    await client.query('COMMIT');
    return activity.activity_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function completeActivityRecord({ activity, outcome, resultNote, nextActivity, stageChange = null, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE crm_activities
       SET status = 'COMPLETED', outcome = $2, result_note = $3,
           completed_at = NOW(), updated_by_user_id = $4, updated_at = NOW()
       WHERE id = $1`,
      [activity.id, outcome, resultNote, actorUserId]
    );
    await client.query(
      `INSERT INTO crm_activity_history (activity_id, event_type, from_scheduled_at, outcome, note, actor_user_id)
       VALUES ($1, 'COMPLETED', $2, $3, $4, $5)`,
      [activity.id, activity.scheduled_at, outcome, resultNote, actorUserId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_ACTIVITY_COMPLETED', 'CRM_ACTIVITY', $2, $3::jsonb)`,
      [
        actorUserId,
        activity.activity_code,
        JSON.stringify({ outcome, leadCode: activity.lead_code || null, dealCode: activity.deal_code || null }),
      ]
    );

    if (activity.lead_id) {
      await client.query(
        `UPDATE crm_leads
         SET status = CASE
               WHEN status IN ('CONVERTED','LOST') THEN status
               WHEN $2::boolean THEN 'FOLLOW_UP'
               ELSE 'CONTACTED'
             END,
             updated_by_user_id = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [activity.lead_id, Boolean(nextActivity), actorUserId]
      );
    }

    if (stageChange?.dealId && stageChange?.toStage) {
      await client.query(
        `UPDATE crm_deals
         SET stage = $2,
             lost_reason = CASE WHEN $2 = 'CLOSED_LOST' THEN $3 ELSE NULL END,
             closed_lost_at = CASE WHEN $2 = 'CLOSED_LOST' THEN NOW() ELSE closed_lost_at END,
             updated_by_user_id = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [stageChange.dealId, stageChange.toStage, stageChange.reason || null, actorUserId]
      );
      await client.query(
        `INSERT INTO crm_deal_stage_history (deal_id, from_stage, to_stage, reason, actor_user_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [stageChange.dealId, stageChange.fromStage, stageChange.toStage, stageChange.reason || 'Updated while completing Activity', actorUserId]
      );
      await client.query(
        `UPDATE crm_commissions
         SET status = CASE WHEN $2 = 'CLOSED_LOST' THEN 'VOID' ELSE status END,
             updated_at = NOW()
         WHERE deal_id = $1`,
        [stageChange.dealId, stageChange.toStage]
      );
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'CRM_DEAL_STAGE_CHANGED_FROM_ACTIVITY', 'CRM_DEAL', $2, $3::jsonb)`,
        [actorUserId, stageChange.dealCode, JSON.stringify({ activityCode: activity.activity_code, from: stageChange.fromStage, to: stageChange.toStage, reason: stageChange.reason || null })]
      );
    }

    let nextActivityCode = null;
    if (nextActivity) {
      const created = await insertActivityWithClient(client, {
        businessUnitId: activity.business_unit_id,
        leadId: activity.lead_id,
        dealId: activity.deal_id,
        ownerUserId: activity.owner_user_id,
        parentActivityId: activity.id,
        payload: nextActivity,
        actorUserId,
      });
      nextActivityCode = created.activity_code;
    }
    await client.query('COMMIT');
    return { activityCode: activity.activity_code, nextActivityCode };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function rescheduleActivityRecord({ activity, scheduledAt, reason, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE crm_activities
       SET status = 'RESCHEDULED', scheduled_at = $2, reschedule_reason = $3,
           updated_by_user_id = $4, updated_at = NOW()
       WHERE id = $1`,
      [activity.id, scheduledAt, reason, actorUserId]
    );
    await client.query(
      `INSERT INTO crm_activity_history (activity_id, event_type, from_scheduled_at, to_scheduled_at, note, actor_user_id)
       VALUES ($1, 'RESCHEDULED', $2, $3, $4, $5)`,
      [activity.id, activity.scheduled_at, scheduledAt, reason, actorUserId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'CRM_ACTIVITY_RESCHEDULED', 'CRM_ACTIVITY', $2, $3::jsonb)`,
      [
        actorUserId,
        activity.activity_code,
        JSON.stringify({ from: activity.scheduled_at, to: scheduledAt, leadCode: activity.lead_code || null, dealCode: activity.deal_code || null }),
      ]
    );
    await client.query('COMMIT');
    return activity.activity_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function updateDealCommercialRecord({ deal, payload, actorUserId }) {
  const result = await db.query(
    `UPDATE crm_deals
     SET package_code = $2,
         license_quantity = $3,
         software_value = $4,
         hardware_value = $5,
         value = $4 + $5,
         currency = $6,
         expected_close_date = $7,
         product_note = $8,
         updated_by_user_id = $9,
         updated_at = NOW()
     WHERE id = $1
     RETURNING deal_code`,
    [
      deal.id,
      payload.packageCode,
      payload.licenseQuantity,
      payload.softwareValue,
      payload.hardwareValue,
      payload.currency,
      payload.expectedCloseDate,
      payload.productNote,
      actorUserId,
    ]
  );
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'CRM_DEAL_COMMERCIAL_UPDATED', 'CRM_DEAL', $2, $3::jsonb)`,
    [actorUserId, result.rows[0].deal_code, JSON.stringify({
      packageCode: payload.packageCode,
      licenseQuantity: payload.licenseQuantity,
      softwareValue: payload.softwareValue,
      hardwareValue: payload.hardwareValue,
      currency: payload.currency,
    })]
  );
  return result.rows[0].deal_code;
}

export async function replaceDealProductLinesRecord({ deal, productLines, totals, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT id, deal_code, stage FROM crm_deals WHERE id=$1 FOR UPDATE`,
      [deal.id]
    );
    if (!locked.rows[0]) throw new Error('CRM Deal not found.');
    if (['CLOSED_WON', 'CLOSED_LOST'].includes(locked.rows[0].stage)) {
      const error = new Error('Closed Deal product lines are locked.');
      error.code = 'CRM_DEAL_ALREADY_CLOSED';
      throw error;
    }

    await client.query('DELETE FROM crm_deal_product_lines WHERE deal_id=$1', [deal.id]);
    for (let index = 0; index < productLines.length; index += 1) {
      const line = productLines[index];
      await client.query(
        `INSERT INTO crm_deal_product_lines (
           deal_id, business_unit_id, product_code, product_name_snapshot, point_type_snapshot,
           unit_label_snapshot, inventory_managed_snapshot, quantity, unit_price, line_value,
           sort_order, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          deal.id, deal.business_unit_id, line.productCode, line.productName, line.pointType,
          line.unitLabel, line.inventoryManaged, line.quantity, line.unitPrice, line.lineValue,
          index + 1, actorUserId,
        ]
      );
    }

    await client.query(
      `UPDATE crm_deals
       SET value=$2,
           software_value=$3,
           hardware_value=$4,
           license_quantity=$5,
           package_code=NULL,
           updated_by_user_id=$6,
           updated_at=NOW()
       WHERE id=$1`,
      [deal.id, totals.value, totals.softwareValue, totals.hardwareValue, totals.licenseQuantity, actorUserId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_DEAL_PRODUCTS_SAVED','CRM_DEAL',$2,$3::jsonb)`,
      [actorUserId, deal.deal_code, JSON.stringify({
        productLines: productLines.map((line) => ({ productCode: line.productCode, quantity: line.quantity, unitPrice: line.unitPrice })),
        totals,
      })]
    );
    await client.query('COMMIT');
    return deal.deal_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getRecognizedPointSummary({ businessUnitCode = 'ALL', ownerUserId = null, periodMonth }) {
  const values = [ownerUserId, periodMonth];
  let buWhere = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    values.push(businessUnitCode);
    buWhere = `AND UPPER(bu.code) = UPPER($3)`;
  }
  const result = await db.query(
    `SELECT
       COALESCE(SUM(r.sw_points),0)::int AS sw_points,
       COALESCE(SUM(r.hw_points),0)::int AS hw_points,
       COALESCE(SUM(r.commission_amount_lak),0) AS amount_lak,
       COUNT(*)::int AS recognized_deals
     FROM crm_point_recognitions r
     JOIN business_units bu ON bu.id = r.business_unit_id
     WHERE ($1::bigint IS NULL OR r.owner_user_id=$1)
       AND r.period_month=$2::date
       ${buWhere}`,
    values
  );
  return result.rows[0] || { sw_points: 0, hw_points: 0, amount_lak: 0, recognized_deals: 0 };
}

async function resolveCommissionPlanForOwner(client, { businessUnitId, ownerUserId, periodMonth }) {
  const result = await client.query(
    `SELECT p.*
     FROM crm_commission_plans p
     WHERE p.business_unit_id=$1
       AND p.period_month=$2::date
       AND p.status <> 'INACTIVE'
       AND (
         (p.scope_type='USER' AND p.owner_user_id=$3)
         OR (
           p.scope_type='TEAM'
           AND EXISTS (
             SELECT 1
             FROM crm_sales_team_members tm
             JOIN crm_bu_memberships m ON m.id=tm.membership_id
             WHERE tm.team_id=p.team_id
               AND m.business_unit_id=$1
               AND m.user_id=$3
               AND m.status='ACTIVE'
           )
         )
         OR (p.scope_type='BU' AND p.team_id IS NULL AND p.owner_user_id IS NULL)
       )
     ORDER BY CASE p.scope_type WHEN 'USER' THEN 0 WHEN 'TEAM' THEN 1 ELSE 2 END, p.id
     LIMIT 1`,
    [businessUnitId, periodMonth, ownerUserId]
  );
  return result.rows[0] || null;
}

async function recalculateOwnerMonthCommission(client, { businessUnitId, ownerUserId, periodMonth }) {
  const plan = await resolveCommissionPlanForOwner(client, { businessUnitId, ownerUserId, periodMonth });
  const totalsResult = await client.query(
    `SELECT COALESCE(SUM(sw_points),0)::int AS sw_points, COALESCE(SUM(hw_points),0)::int AS hw_points
     FROM crm_point_recognitions
     WHERE business_unit_id=$1 AND owner_user_id=$2 AND period_month=$3::date`,
    [businessUnitId, ownerUserId, periodMonth]
  );
  const monthlySWPoints = Number(totalsResult.rows[0]?.sw_points || 0);
  let tier = null;
  if (plan) {
    const tierResult = await client.query(
      `SELECT tier_code, name, min_sw_points, max_sw_points, lak_per_sw_point
       FROM crm_commission_tiers
       WHERE plan_id=$1
         AND min_sw_points <= $2
         AND (max_sw_points IS NULL OR max_sw_points >= $2)
       ORDER BY position DESC, min_sw_points DESC
       LIMIT 1`,
      [plan.id, monthlySWPoints]
    );
    tier = tierResult.rows[0] || null;
  }
  const swRate = Number(tier?.lak_per_sw_point || 0);
  const hwRate = Number(plan?.hardware_lak_per_point || 0);

  await client.query(
    `UPDATE crm_point_recognitions
     SET commission_plan_id=$4,
         commission_plan_name_snapshot=$5,
         commission_tier_code=$6,
         sw_lak_per_point=$7,
         hw_lak_per_point=$8,
         commission_amount_lak=(sw_points * $7) + (hw_points * $8),
         recalculated_at=NOW()
     WHERE business_unit_id=$1 AND owner_user_id=$2 AND period_month=$3::date`,
    [businessUnitId, ownerUserId, periodMonth, plan?.id || null, plan?.name || null, tier?.tier_code || null, swRate, hwRate]
  );

  await client.query(
    `UPDATE crm_commissions c
     SET recognition_period=r.period_month,
         recognized_sw_points=r.sw_points,
         recognized_hw_points=r.hw_points,
         commission_plan_id=r.commission_plan_id,
         commission_tier_code=r.commission_tier_code,
         sw_lak_per_point=r.sw_lak_per_point,
         hw_lak_per_point=r.hw_lak_per_point,
         amount_lak=r.commission_amount_lak,
         status=CASE WHEN c.status='PAID' THEN 'PAID' ELSE 'CONFIRMED' END,
         confirmed_at=COALESCE(c.confirmed_at, NOW()),
         updated_at=NOW()
     FROM crm_point_recognitions r
     WHERE c.deal_id=r.deal_id
       AND r.business_unit_id=$1 AND r.owner_user_id=$2 AND r.period_month=$3::date`,
    [businessUnitId, ownerUserId, periodMonth]
  );
}

async function recognizeDealPoints(client, { deal, periodMonth, actorUserId }) {
  const existing = await client.query('SELECT id FROM crm_point_recognitions WHERE deal_id=$1', [deal.id]);
  if (existing.rows[0]) return existing.rows[0].id;

  const linesResult = await client.query(
    `SELECT id, product_code, product_name_snapshot, point_type_snapshot, unit_label_snapshot, quantity
     FROM crm_deal_product_lines
     WHERE deal_id=$1
     ORDER BY sort_order, id`,
    [deal.id]
  );
  if (!linesResult.rows.length) {
    const error = new Error('Deal Product Lines are required before Finance can close the Deal as Won.');
    error.code = 'CRM_DEAL_PRODUCTS_REQUIRED';
    throw error;
  }

  const rulesResult = await client.query(
    `SELECT product_code, points_per_unit
     FROM crm_point_rules
     WHERE business_unit_id=$1 AND period_month=$2::date`,
    [deal.business_unit_id, periodMonth]
  );
  const rules = new Map(rulesResult.rows.map((row) => [row.product_code, Number(row.points_per_unit || 0)]));
  const snapshots = linesResult.rows.map((line) => {
    const pointsPerUnit = rules.get(line.product_code) || 0;
    const totalPoints = pointsPerUnit * Number(line.quantity || 0);
    return { ...line, pointsPerUnit, totalPoints };
  });
  const swPoints = snapshots.filter((line) => line.point_type_snapshot === 'SOFTWARE').reduce((sum, line) => sum + line.totalPoints, 0);
  const hwPoints = snapshots.filter((line) => line.point_type_snapshot === 'HARDWARE').reduce((sum, line) => sum + line.totalPoints, 0);

  const inserted = await client.query(
    `INSERT INTO crm_point_recognitions (
       deal_id, business_unit_id, owner_user_id, period_month, sw_points, hw_points, recognized_at, recalculated_at
     ) VALUES ($1,$2,$3,$4::date,$5,$6,NOW(),NOW()) RETURNING id`,
    [deal.id, deal.business_unit_id, deal.owner_user_id, periodMonth, swPoints, hwPoints]
  );
  const recognitionId = inserted.rows[0].id;
  for (const line of snapshots) {
    await client.query(
      `INSERT INTO crm_point_recognition_lines (
         recognition_id, deal_product_line_id, product_code, product_name_snapshot, point_type_snapshot,
         unit_label_snapshot, quantity, points_per_unit, total_points
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [recognitionId, line.id, line.product_code, line.product_name_snapshot, line.point_type_snapshot, line.unit_label_snapshot, line.quantity, line.pointsPerUnit, line.totalPoints]
    );
  }
  await recalculateOwnerMonthCommission(client, {
    businessUnitId: deal.business_unit_id,
    ownerUserId: deal.owner_user_id,
    periodMonth,
  });
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1,'CRM_POINT_RECOGNIZED','CRM_DEAL',$2,$3::jsonb)`,
    [actorUserId, deal.deal_code, JSON.stringify({ periodMonth, swPoints, hwPoints })]
  );
  return recognitionId;
}


function normalizedKey(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

async function ensureCustomerMasterForClosedWon(client, { deal, actorUserId }) {
  const currentDealResult = await client.query(
    `SELECT d.id, d.deal_code, d.business_unit_id, d.source_lead_id, d.customer_id,
            d.store_name, d.primary_contact,
            l.legal_company_name, l.individual_name, l.phone, l.email, l.whatsapp, l.province
     FROM crm_deals d
     LEFT JOIN crm_leads l ON l.id = d.source_lead_id
     WHERE d.id=$1
     FOR UPDATE OF d`,
    [deal.id]
  );
  const current = currentDealResult.rows[0];
  if (!current) throw new Error('CRM Deal not found while linking Customer Master.');

  if (current.customer_id) {
    await client.query(
      `INSERT INTO customer_master_business_units(customer_id, business_unit_id, status, created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,'ACTIVE',$3,$3)
       ON CONFLICT (customer_id, business_unit_id) DO UPDATE SET
         status='ACTIVE', updated_by_user_id=EXCLUDED.updated_by_user_id, updated_at=NOW()`,
      [current.customer_id, current.business_unit_id, actorUserId]
    );
    if (current.source_lead_id) {
      await client.query(
        `UPDATE crm_leads SET customer_id=$2, updated_by_user_id=$3, updated_at=NOW()
         WHERE id=$1 AND customer_id IS DISTINCT FROM $2`,
        [current.source_lead_id, current.customer_id, actorUserId]
      );
    }
    return current.customer_id;
  }

  const displayName = String(current.store_name || current.legal_company_name || current.individual_name || 'Customer').trim();
  const legalName = String(current.legal_company_name || '').trim() || null;
  const phone = String(current.phone || '').trim() || null;
  const email = String(current.email || '').trim() || null;
  const customerType = current.individual_name && !current.legal_company_name ? 'INDIVIDUAL' : 'BUSINESS';

  const candidates = await client.query(
    `SELECT cm.id
     FROM customer_master cm
     JOIN customer_master_business_units cmbu ON cmbu.customer_id=cm.id
     WHERE cmbu.business_unit_id=$1
       AND (
         ($2::text IS NOT NULL AND LOWER(TRIM(COALESCE(cm.legal_company_name,''))) = LOWER(TRIM($2)))
         OR ($3::text IS NOT NULL AND regexp_replace(COALESCE(cm.phone,''), '[^0-9]+', '', 'g') = regexp_replace($3, '[^0-9]+', '', 'g'))
         OR ($4::text IS NOT NULL AND LOWER(TRIM(COALESCE(cm.email,''))) = LOWER(TRIM($4)))
         OR LOWER(TRIM(cm.display_name)) = LOWER(TRIM($5))
       )
     ORDER BY
       CASE WHEN $2::text IS NOT NULL AND LOWER(TRIM(COALESCE(cm.legal_company_name,''))) = LOWER(TRIM($2)) THEN 0 ELSE 1 END,
       CASE WHEN $3::text IS NOT NULL AND regexp_replace(COALESCE(cm.phone,''), '[^0-9]+', '', 'g') = regexp_replace($3, '[^0-9]+', '', 'g') THEN 0 ELSE 1 END,
       cm.id
     LIMIT 1
     FOR UPDATE OF cm`,
    [current.business_unit_id, legalName, phone, email, displayName]
  );

  let customerId = candidates.rows[0]?.id || null;
  if (customerId) {
    await client.query(
      `UPDATE customer_master
       SET display_name=COALESCE(NULLIF($2,''), display_name),
           legal_company_name=COALESCE(NULLIF($3,''), legal_company_name),
           customer_type=$4,
           primary_contact=COALESCE(NULLIF($5,''), primary_contact),
           phone=COALESCE(NULLIF($6,''), phone),
           email=COALESCE(NULLIF($7,''), email),
           whatsapp=COALESCE(NULLIF($8,''), whatsapp),
           province=COALESCE(NULLIF($9,''), province),
           status='ACTIVE',
           updated_by_user_id=$10,
           updated_at=NOW()
       WHERE id=$1`,
      [customerId, displayName, legalName, customerType, String(current.primary_contact || '').trim(), phone, email, String(current.whatsapp || '').trim(), String(current.province || '').trim(), actorUserId]
    );
  } else {
    const inserted = await client.query(
      `INSERT INTO customer_master(
         display_name, legal_company_name, customer_type, primary_contact, phone, email, whatsapp, province,
         status, created_by_user_id, updated_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9,$9)
       RETURNING id`,
      [displayName, legalName, customerType, String(current.primary_contact || '').trim() || null, phone, email, String(current.whatsapp || '').trim() || null, String(current.province || '').trim() || null, actorUserId]
    );
    customerId = inserted.rows[0].id;
  }

  await client.query(
    `INSERT INTO customer_master_business_units(customer_id, business_unit_id, status, created_by_user_id, updated_by_user_id)
     VALUES ($1,$2,'ACTIVE',$3,$3)
     ON CONFLICT (customer_id, business_unit_id) DO UPDATE SET
       status='ACTIVE', updated_by_user_id=EXCLUDED.updated_by_user_id, updated_at=NOW()`,
    [customerId, current.business_unit_id, actorUserId]
  );

  await client.query(
    `UPDATE crm_deals
     SET customer_id=$2, customer_linked_at=COALESCE(customer_linked_at,NOW()), updated_by_user_id=$3, updated_at=NOW()
     WHERE id=$1`,
    [current.id, customerId, actorUserId]
  );
  if (current.source_lead_id) {
    await client.query(
      `UPDATE crm_leads SET customer_id=$2, updated_by_user_id=$3, updated_at=NOW() WHERE id=$1`,
      [current.source_lead_id, customerId, actorUserId]
    );
  }

  const customerRow = await client.query('SELECT customer_code FROM customer_master WHERE id=$1', [customerId]);
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1,'CUSTOMER_MASTER_LINKED','CUSTOMER_MASTER',$2,$3::jsonb)`,
    [actorUserId, customerRow.rows[0]?.customer_code || String(customerId), JSON.stringify({ dealCode: current.deal_code, businessUnitId: current.business_unit_id, matchKey: normalizedKey(legalName || phone || email || displayName) })]
  );
  return customerId;
}

export async function processCRMIntegrationEventRecord({ deal, sourceSystem, externalEventId, eventType, payload, periodMonth, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const eventInsert = await client.query(
      `INSERT INTO crm_integration_events (
         source_system, external_event_id, event_type, deal_id, deal_code, payload, status, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'RECEIVED',$7)
       ON CONFLICT (source_system, external_event_id) DO NOTHING
       RETURNING id`,
      [sourceSystem, externalEventId, eventType, deal.id, deal.deal_code, JSON.stringify(payload || {}), actorUserId]
    );
    if (!eventInsert.rows[0]) {
      await client.query('ROLLBACK');
      return { duplicate: true };
    }
    const eventId = eventInsert.rows[0].id;
    const currentResult = await client.query(
      `SELECT * FROM crm_deals WHERE id=$1 FOR UPDATE`,
      [deal.id]
    );
    const current = currentResult.rows[0];
    if (!current) throw new Error('CRM Deal not found.');

    if (eventType === 'QUOTATION_LINKED') {
      if (!payload.quotationNumber) throw new Error('Quotation Number is required.');
      await client.query(
        `UPDATE crm_deals SET quotation_number=$2, updated_by_user_id=$3, updated_at=NOW() WHERE id=$1`,
        [deal.id, payload.quotationNumber, actorUserId]
      );
    } else if (eventType === 'QUOTATION_CONFIRMED') {
      const quotationNumber = payload.quotationNumber || current.quotation_number;
      if (!quotationNumber) throw new Error('Link Quotation before confirmation.');
      await client.query(
        `UPDATE crm_deals
         SET quotation_number=$2, quotation_confirmed_at=COALESCE(quotation_confirmed_at, NOW()), updated_by_user_id=$3, updated_at=NOW()
         WHERE id=$1`,
        [deal.id, quotationNumber, actorUserId]
      );
    } else if (eventType === 'PAYMENT_SLIP_UPLOADED') {
      if (!current.quotation_confirmed_at) throw new Error('Confirmed Quotation is required before Payment Slip upload.');
      await client.query(
        `UPDATE crm_deals SET payment_slip_uploaded_at=COALESCE(payment_slip_uploaded_at, NOW()), updated_by_user_id=$2, updated_at=NOW() WHERE id=$1`,
        [deal.id, actorUserId]
      );
    } else if (eventType === 'FINANCE_CONFIRMED_INVOICE') {
      if (!payload.invoiceNumber) throw new Error('Invoice Number is required for Finance confirmation.');
      if (!current.quotation_confirmed_at) throw new Error('Confirmed Quotation is required before Finance confirmation.');
      if (!current.payment_slip_uploaded_at) throw new Error('Payment Slip must be uploaded before Finance confirmation.');
      if (current.stage === 'CLOSED_LOST') throw new Error('Closed Lost Deal cannot be confirmed as Won.');
      if (current.stage !== 'AWAITING_PAYMENT') throw new Error('Deal must be in Awaiting Payment before Finance can confirm Invoice and close Won.');
      await client.query(
        `UPDATE crm_deals
         SET finance_payment_confirmed_at=COALESCE(finance_payment_confirmed_at, NOW()),
             invoice_number=$2,
             invoice_received_at=COALESCE(invoice_received_at, NOW()),
             stage='CLOSED_WON',
             closed_won_at=COALESCE(closed_won_at, NOW()),
             lost_reason=NULL,
             updated_by_user_id=$3,
             updated_at=NOW()
         WHERE id=$1`,
        [deal.id, payload.invoiceNumber, actorUserId]
      );
      if (current.stage !== 'CLOSED_WON') {
        await client.query(
          `INSERT INTO crm_deal_stage_history (deal_id, from_stage, to_stage, reason, actor_user_id)
           VALUES ($1,$2,'CLOSED_WON','Finance confirmed payment + Invoice',$3)`,
          [deal.id, current.stage, actorUserId]
        );
      }
      await ensureCustomerMasterForClosedWon(client, { deal: { ...deal, ...current }, actorUserId });
      await recognizeDealPoints(client, { deal: { ...deal, ...current }, periodMonth, actorUserId });
    }

    await client.query(
      `UPDATE crm_integration_events SET status='PROCESSED', processed_at=NOW() WHERE id=$1`,
      [eventId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_INTEGRATION_EVENT_PROCESSED','CRM_DEAL',$2,$3::jsonb)`,
      [actorUserId, deal.deal_code, JSON.stringify({ sourceSystem, externalEventId, eventType })]
    );
    await client.query('COMMIT');
    return { duplicate: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getSalesPerformanceRecord({ businessUnitCode = 'ALL', ownerUserId = null, periodStart, periodEnd }) {
  const values = [ownerUserId, periodStart, periodEnd];
  let buJoin = '';
  let buWhere = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    values.push(businessUnitCode);
    buJoin = 'JOIN business_units bu ON bu.id = d.business_unit_id';
    buWhere = `AND UPPER(bu.code) = UPPER($4)`;
  }

  const deals = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE d.created_at >= $2 AND d.created_at < $3) AS deals_created,
       COALESCE(SUM(d.license_quantity) FILTER (WHERE d.stage = 'CLOSED_WON' AND COALESCE(d.closed_won_at, d.updated_at) >= $2 AND COALESCE(d.closed_won_at, d.updated_at) < $3), 0) AS won_licenses,
       COUNT(*) FILTER (WHERE d.stage = 'CLOSED_WON' AND COALESCE(d.closed_won_at, d.updated_at) >= $2 AND COALESCE(d.closed_won_at, d.updated_at) < $3) AS won_deals,
       COUNT(*) FILTER (WHERE d.stage = 'CLOSED_LOST' AND COALESCE(d.closed_lost_at, d.updated_at) >= $2 AND COALESCE(d.closed_lost_at, d.updated_at) < $3) AS lost_deals,
       COALESCE(SUM(d.value) FILTER (WHERE d.stage = 'CLOSED_WON' AND d.currency = 'LAK' AND COALESCE(d.closed_won_at, d.updated_at) >= $2 AND COALESCE(d.closed_won_at, d.updated_at) < $3), 0) AS won_value_lak,
       COALESCE(SUM(d.value) FILTER (WHERE d.stage = 'CLOSED_WON' AND d.currency = 'USD' AND COALESCE(d.closed_won_at, d.updated_at) >= $2 AND COALESCE(d.closed_won_at, d.updated_at) < $3), 0) AS won_value_usd,
       COALESCE(SUM(d.value) FILTER (WHERE d.stage = 'CLOSED_WON' AND d.currency = 'THB' AND COALESCE(d.closed_won_at, d.updated_at) >= $2 AND COALESCE(d.closed_won_at, d.updated_at) < $3), 0) AS won_value_thb
     FROM crm_deals d
     ${buJoin}
     WHERE ($1::bigint IS NULL OR d.owner_user_id = $1)
     ${buWhere}`,
    values
  );

  const leadValues = [ownerUserId, periodStart, periodEnd];
  let leadBuJoin = '';
  let leadBuWhere = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    leadValues.push(businessUnitCode);
    leadBuJoin = 'JOIN business_units bu ON bu.id = l.business_unit_id';
    leadBuWhere = `AND UPPER(bu.code) = UPPER($4)`;
  }
  const leads = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE l.created_at >= $2 AND l.created_at < $3) AS new_leads,
       COUNT(*) FILTER (WHERE l.status = 'CONVERTED' AND l.updated_at >= $2 AND l.updated_at < $3) AS converted_leads
     FROM crm_leads l
     ${leadBuJoin}
     WHERE ($1::bigint IS NULL OR l.owner_user_id = $1)
     ${leadBuWhere}`,
    leadValues
  );

  const activityValues = [ownerUserId, periodStart, periodEnd];
  let activityBuJoin = '';
  let activityBuWhere = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    activityValues.push(businessUnitCode);
    activityBuJoin = 'JOIN business_units bu ON bu.id = a.business_unit_id';
    activityBuWhere = `AND UPPER(bu.code) = UPPER($4)`;
  }
  const activities = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE a.status = 'COMPLETED' AND a.completed_at >= $2 AND a.completed_at < $3) AS completed_activities,
       COUNT(*) FILTER (WHERE a.status IN ('SCHEDULED','RESCHEDULED') AND a.scheduled_at < NOW()) AS overdue_activities
     FROM crm_activities a
     ${activityBuJoin}
     WHERE ($1::bigint IS NULL OR a.owner_user_id = $1)
     ${activityBuWhere}`,
    activityValues
  );

  let targetValues = [ownerUserId, periodStart];
  let targetBu = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    targetValues.push(businessUnitCode);
    targetBu = `AND UPPER(bu.code) = UPPER($3)`;
  }
  const target = await db.query(
    `SELECT t.target_licenses, t.target_revenue, t.currency
     FROM crm_sales_targets t
     JOIN business_units bu ON bu.id = t.business_unit_id
     WHERE t.period_month = $2::date
       ${targetBu}
       AND (t.owner_user_id = $1 OR t.owner_user_id IS NULL)
     ORDER BY CASE WHEN t.owner_user_id = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    targetValues
  );

  return {
    deals: deals.rows[0],
    leads: leads.rows[0],
    activities: activities.rows[0],
    target: target.rows[0] || null,
  };
}

export async function listCommissionRecords({ businessUnitCode = 'ALL', ownerUserId = null }) {
  const values = [ownerUserId];
  let buWhere = '';
  if (businessUnitCode && businessUnitCode !== 'ALL') {
    values.push(businessUnitCode);
    buWhere = `AND UPPER(bu.code) = UPPER($2)`;
  }
  const result = await db.query(
    `SELECT
       d.deal_code,
       d.store_name,
       d.package_code,
       d.license_quantity,
       d.software_value,
       d.hardware_value,
       d.currency,
       d.stage,
       d.created_at,
       d.closed_won_at,
       c.software_rate,
       c.hardware_rate,
       c.status,
       c.confirmed_at,
       c.paid_at,
       c.finance_reference,
       c.payroll_reference,
       bu.code AS business_unit_code
     FROM crm_commissions c
     JOIN crm_deals d ON d.id = c.deal_id
     JOIN business_units bu ON bu.id = c.business_unit_id
     WHERE ($1::bigint IS NULL OR c.owner_user_id = $1)
       ${buWhere}
     ORDER BY COALESCE(c.paid_at, c.confirmed_at, d.closed_won_at, d.updated_at) DESC, d.id DESC
     LIMIT 500`,
    values
  );
  return result.rows;
}

// --- v2.6.0.0 CRM BU Access + Settings ------------------------------------

export async function listCRMUserMembershipUnits(userId) {
  if (!userId) return [];
  const result = await db.query(
    `SELECT bu.id, bu.code, bu.name, bu.status
     FROM crm_bu_memberships m
     JOIN business_units bu ON bu.id = m.business_unit_id
     WHERE m.user_id = $1
       AND m.status = 'ACTIVE'
       AND m.effective_from <= CURRENT_DATE
       AND (m.effective_to IS NULL OR m.effective_to >= CURRENT_DATE)
       AND bu.status = 'ACTIVE'
     ORDER BY bu.code`,
    [userId]
  );
  return result.rows;
}

export async function getCRMUserAccessRows(userId) {
  if (!userId) return [];
  const result = await db.query(
    `SELECT
       m.id AS membership_id,
       m.business_unit_id,
       bu.code AS business_unit_code,
       bu.name AS business_unit_name,
       m.status,
       m.effective_from,
       m.effective_to,
       COALESCE(jsonb_agg(DISTINCT jsonb_build_object(
         'code', r.code,
         'name', r.name,
         'accessLevel', r.access_level,
         'dataScope', r.data_scope,
         'capabilities', r.capabilities
       )) FILTER (WHERE r.code IS NOT NULL), '[]'::jsonb) AS roles
     FROM crm_bu_memberships m
     JOIN business_units bu ON bu.id = m.business_unit_id
     LEFT JOIN crm_bu_membership_roles mr ON mr.membership_id = m.id
     LEFT JOIN crm_role_definitions r ON r.code = mr.role_code AND r.is_active = TRUE
     WHERE m.user_id = $1
       AND m.status = 'ACTIVE'
       AND m.effective_from <= CURRENT_DATE
       AND (m.effective_to IS NULL OR m.effective_to >= CURRENT_DATE)
       AND bu.status = 'ACTIVE'
     GROUP BY m.id, bu.id
     ORDER BY bu.code`,
    [userId]
  );
  return result.rows;
}

export async function listCRMSettingsUsers() {
  const result = await db.query(
    `SELECT
       u.id,
       u.email,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.nickname
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     ORDER BY COALESCE(e.first_name, ''), COALESCE(e.last_name, ''), u.email`
  );
  return result.rows.map((row) => ({
    ...row,
    display_name: ownerName({
      owner_first_name: row.first_name,
      owner_last_name: row.last_name,
      owner_nickname: row.nickname,
      owner_email: row.email,
    }),
  }));
}

export async function listCRMRoleDefinitions() {
  const result = await db.query(
    `SELECT code, name, description, access_level, data_scope, capabilities, is_system, is_active
     FROM crm_role_definitions
     WHERE is_active = TRUE
     ORDER BY access_level DESC, code`
  );
  return result.rows;
}

export async function getCRMBUSettingsRecord(businessUnitId) {
  const result = await db.query(
    `SELECT s.*, bu.code AS business_unit_code, bu.name AS business_unit_name
     FROM crm_bu_settings s
     JOIN business_units bu ON bu.id = s.business_unit_id
     WHERE s.business_unit_id = $1`,
    [businessUnitId]
  );
  return result.rows[0] || null;
}

export async function listCRMBUMembers(businessUnitId) {
  const result = await db.query(
    `SELECT
       m.id,
       m.user_id,
       m.status,
       m.effective_from,
       m.effective_to,
       u.email,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.nickname,
       COALESCE(array_agg(DISTINCT mr.role_code) FILTER (WHERE mr.role_code IS NOT NULL), ARRAY[]::varchar[]) AS role_codes,
       COALESCE(array_agg(DISTINCT tm.team_id::text) FILTER (WHERE tm.team_id IS NOT NULL), ARRAY[]::text[]) AS team_ids
     FROM crm_bu_memberships m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN crm_bu_membership_roles mr ON mr.membership_id = m.id
     LEFT JOIN crm_sales_team_members tm ON tm.membership_id = m.id
     WHERE m.business_unit_id = $1
     GROUP BY m.id, u.id, e.id
     ORDER BY COALESCE(e.first_name, ''), COALESCE(e.last_name, ''), u.email`,
    [businessUnitId]
  );
  return result.rows.map((row) => ({
    ...row,
    display_name: ownerName({
      owner_first_name: row.first_name,
      owner_last_name: row.last_name,
      owner_nickname: row.nickname,
      owner_email: row.email,
    }),
  }));
}

export async function listCRMSalesTeams(businessUnitId) {
  const result = await db.query(
    `SELECT
       t.id, t.team_code, t.name, t.manager_user_id, t.status,
       u.email AS manager_email,
       e.first_name AS manager_first_name,
       e.last_name AS manager_last_name,
       e.nickname AS manager_nickname,
       COUNT(tm.membership_id)::int AS member_count
     FROM crm_sales_teams t
     LEFT JOIN users u ON u.id = t.manager_user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN crm_sales_team_members tm ON tm.team_id = t.id
     WHERE t.business_unit_id = $1
     GROUP BY t.id, u.id, e.id
     ORDER BY t.name`,
    [businessUnitId]
  );
  return result.rows.map((row) => ({
    ...row,
    manager_display_name: row.manager_user_id ? ownerName({
      owner_first_name: row.manager_first_name,
      owner_last_name: row.manager_last_name,
      owner_nickname: row.manager_nickname,
      owner_email: row.manager_email,
    }) : null,
  }));
}

export async function listCRMPipelineSettings(businessUnitId) {
  const result = await db.query(
    `SELECT stage_code, label, position, is_enabled, is_system_controlled
     FROM crm_pipeline_stage_settings
     WHERE business_unit_id = $1
     ORDER BY position, stage_code`,
    [businessUnitId]
  );
  return result.rows;
}

export async function listCRMPointRules(businessUnitId, periodMonth, { fallbackToLatest = false } = {}) {
  const exact = await db.query(
    `SELECT id, product_code, product_name, point_type, unit_label, points_per_unit, period_month, locked_at
     FROM crm_point_rules
     WHERE business_unit_id = $1 AND period_month = $2::date
     ORDER BY CASE WHEN point_type = 'SOFTWARE' THEN 0 ELSE 1 END, product_code`,
    [businessUnitId, periodMonth]
  );
  if (!fallbackToLatest) return exact.rows;

  const fallback = await db.query(
    `SELECT DISTINCT ON (product_code)
       id, product_code, product_name, point_type, unit_label, points_per_unit, period_month, locked_at
     FROM crm_point_rules
     WHERE business_unit_id = $1 AND period_month < $2::date
     ORDER BY product_code, period_month DESC`,
    [businessUnitId, periodMonth]
  );
  const exactCodes = new Set(exact.rows.map((row) => row.product_code));
  const rows = [...exact.rows, ...fallback.rows.filter((row) => !exactCodes.has(row.product_code))];
  return rows.sort((a, b) => {
    const typeOrder = (a.point_type === 'SOFTWARE' ? 0 : 1) - (b.point_type === 'SOFTWARE' ? 0 : 1);
    return typeOrder || String(a.product_code).localeCompare(String(b.product_code));
  });
}

export async function listCRMProductReferenceRows(businessUnitId) {
  const result = await db.query(
    `SELECT DISTINCT ON (product_code)
       product_code, product_name, point_type, unit_label, period_month
     FROM crm_point_rules
     WHERE business_unit_id = $1
     ORDER BY product_code, period_month DESC`,
    [businessUnitId]
  );
  return result.rows;
}

export async function listCRMSalesPointTargets(businessUnitId, periodMonth) {
  const result = await db.query(
    `SELECT
       t.id, t.team_id, t.owner_user_id, t.target_sw_points, t.target_revenue,
       t.currency, t.period_month, t.locked_at,
       st.name AS team_name,
       u.email AS owner_email,
       e.first_name AS owner_first_name,
       e.last_name AS owner_last_name,
       e.nickname AS owner_nickname
     FROM crm_sales_point_targets t
     LEFT JOIN crm_sales_teams st ON st.id = t.team_id
     LEFT JOIN users u ON u.id = t.owner_user_id
     LEFT JOIN employees e ON e.id = u.employee_id
     WHERE t.business_unit_id = $1 AND t.period_month = $2::date
     ORDER BY CASE WHEN t.owner_user_id IS NOT NULL THEN 0 WHEN t.team_id IS NOT NULL THEN 1 ELSE 2 END,
              COALESCE(e.first_name, st.name, '')`,
    [businessUnitId, periodMonth]
  );
  return result.rows.map((row) => ({
    ...row,
    owner_display_name: row.owner_user_id ? ownerName({
      owner_first_name: row.owner_first_name,
      owner_last_name: row.owner_last_name,
      owner_nickname: row.owner_nickname,
      owner_email: row.owner_email,
    }) : null,
  }));
}

export async function listCRMCommissionPlans(businessUnitId, periodMonth, { fallbackToLatest = false } = {}) {
  async function loadForMonth(month) {
    const result = await db.query(
      `SELECT
         p.id, p.scope_type, p.team_id, p.owner_user_id, p.name, p.model_type,
         p.hardware_lak_per_point, p.status, p.rule_source, p.period_month, p.locked_at,
         st.name AS team_name,
         u.email AS owner_email,
         e.first_name AS owner_first_name,
         e.last_name AS owner_last_name,
         e.nickname AS owner_nickname,
         COALESCE(
           json_agg(
             json_build_object(
               'id', ct.id,
               'tier_code', ct.tier_code,
               'name', ct.name,
               'min_sw_points', ct.min_sw_points,
               'max_sw_points', ct.max_sw_points,
               'lak_per_sw_point', ct.lak_per_sw_point,
               'position', ct.position
             ) ORDER BY ct.position, ct.min_sw_points
           ) FILTER (WHERE ct.id IS NOT NULL),
           '[]'::json
         ) AS tiers
       FROM crm_commission_plans p
       LEFT JOIN crm_sales_teams st ON st.id = p.team_id
       LEFT JOIN users u ON u.id = p.owner_user_id
       LEFT JOIN employees e ON e.id = u.employee_id
       LEFT JOIN crm_commission_tiers ct ON ct.plan_id = p.id
       WHERE p.business_unit_id = $1 AND p.period_month = $2::date AND p.status <> 'INACTIVE'
       GROUP BY p.id, st.name, u.email, e.first_name, e.last_name, e.nickname
       ORDER BY CASE p.scope_type WHEN 'USER' THEN 0 WHEN 'TEAM' THEN 1 ELSE 2 END, p.id`,
      [businessUnitId, month]
    );
    return result.rows.map((row) => ({
      ...row,
      owner_display_name: row.owner_user_id ? ownerName({
        owner_first_name: row.owner_first_name,
        owner_last_name: row.owner_last_name,
        owner_nickname: row.owner_nickname,
        owner_email: row.owner_email,
      }) : null,
    }));
  }

  const exact = await loadForMonth(periodMonth);
  if (exact.length || !fallbackToLatest) return exact;
  const latest = await db.query(
    `SELECT MAX(period_month) AS period_month
     FROM crm_commission_plans
     WHERE business_unit_id = $1 AND period_month < $2::date AND status <> 'INACTIVE'`,
    [businessUnitId, periodMonth]
  );
  const latestMonth = latest.rows[0]?.period_month;
  return latestMonth ? loadForMonth(latestMonth) : [];
}

export async function saveCRMBUGeneralRecord({ businessUnitId, currency, timezone, defaultSWPointTarget, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO crm_bu_settings (
         business_unit_id, currency, timezone, default_sw_point_target,
         created_by_user_id, updated_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$5)
       ON CONFLICT (business_unit_id) DO UPDATE SET
         currency = EXCLUDED.currency,
         timezone = EXCLUDED.timezone,
         default_sw_point_target = EXCLUDED.default_sw_point_target,
         updated_by_user_id = EXCLUDED.updated_by_user_id,
         updated_at = NOW()
       RETURNING *`,
      [businessUnitId, currency, timezone, defaultSWPointTarget, actorUserId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_BU_SETTINGS_SAVED','CRM_BU_SETTINGS',$2,$3::jsonb)`,
      [actorUserId, String(businessUnitId), JSON.stringify({ currency, timezone, defaultSWPointTarget })]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCRMBUMemberRecord({ businessUnitId, userId, status, effectiveFrom, effectiveTo, roleCodes, teamIds, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const membership = await client.query(
      `INSERT INTO crm_bu_memberships (
         business_unit_id, user_id, status, effective_from, effective_to,
         created_by_user_id, updated_by_user_id
       ) VALUES ($1,$2,$3,$4::date,$5::date,$6,$6)
       ON CONFLICT (business_unit_id, user_id) DO UPDATE SET
         status = EXCLUDED.status,
         effective_from = EXCLUDED.effective_from,
         effective_to = EXCLUDED.effective_to,
         updated_by_user_id = EXCLUDED.updated_by_user_id,
         updated_at = NOW()
       RETURNING id`,
      [businessUnitId, userId, status, effectiveFrom, effectiveTo, actorUserId]
    );
    const membershipId = membership.rows[0].id;
    await client.query('DELETE FROM crm_bu_membership_roles WHERE membership_id = $1', [membershipId]);
    for (const roleCode of roleCodes) {
      await client.query(
        `INSERT INTO crm_bu_membership_roles (membership_id, role_code, created_by_user_id)
         VALUES ($1,$2,$3)`,
        [membershipId, roleCode, actorUserId]
      );
    }
    await client.query('DELETE FROM crm_sales_team_members WHERE membership_id = $1', [membershipId]);
    for (const teamId of teamIds) {
      await client.query(
        `INSERT INTO crm_sales_team_members (team_id, membership_id, created_by_user_id)
         SELECT id, $2, $3 FROM crm_sales_teams WHERE id = $1 AND business_unit_id = $4`,
        [teamId, membershipId, actorUserId, businessUnitId]
      );
    }
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_BU_MEMBER_SAVED','CRM_BU_MEMBERSHIP',$2,$3::jsonb)`,
      [actorUserId, String(membershipId), JSON.stringify({ businessUnitId: String(businessUnitId), userId: String(userId), roleCodes, teamIds, status })]
    );
    await client.query('COMMIT');
    return membershipId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCRMSalesTeamRecord({ businessUnitId, teamId, teamCode, name, managerUserId, status, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let id = teamId || null;
    if (teamId) {
      const result = await client.query(
        `UPDATE crm_sales_teams
         SET team_code=$3, name=$4, manager_user_id=$5, status=$6, updated_by_user_id=$7, updated_at=NOW()
         WHERE id=$1 AND business_unit_id=$2
         RETURNING id`,
        [teamId, businessUnitId, teamCode, name, managerUserId, status, actorUserId]
      );
      id = result.rows[0]?.id || null;
    } else {
      const result = await client.query(
        `INSERT INTO crm_sales_teams (business_unit_id, team_code, name, manager_user_id, status, created_by_user_id, updated_by_user_id)
         VALUES ($1,$2,$3,$4,$5,$6,$6)
         RETURNING id`,
        [businessUnitId, teamCode, name, managerUserId, status, actorUserId]
      );
      id = result.rows[0].id;
    }
    if (!id) throw new Error('CRM Sales Team not found in this Business Unit.');
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_SALES_TEAM_SAVED','CRM_SALES_TEAM',$2,$3::jsonb)`,
      [actorUserId, String(id), JSON.stringify({ businessUnitId: String(businessUnitId), teamCode, name, managerUserId, status })]
    );
    await client.query('COMMIT');
    return id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCRMPipelineSettingsRecords({ businessUnitId, stages, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const stage of stages) {
      await client.query(
        `INSERT INTO crm_pipeline_stage_settings (
           business_unit_id, stage_code, label, position, is_enabled, is_system_controlled, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (business_unit_id, stage_code) DO UPDATE SET
           label=EXCLUDED.label, position=EXCLUDED.position, is_enabled=EXCLUDED.is_enabled,
           is_system_controlled=EXCLUDED.is_system_controlled, updated_by_user_id=EXCLUDED.updated_by_user_id, updated_at=NOW()`,
        [businessUnitId, stage.stageCode, stage.label, stage.position, stage.isEnabled, stage.isSystemControlled, actorUserId]
      );
    }
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_PIPELINE_SETTINGS_SAVED','CRM_PIPELINE_SETTINGS',$2,$3::jsonb)`,
      [actorUserId, String(businessUnitId), JSON.stringify({ stages: stages.map((stage) => ({ stageCode: stage.stageCode, position: stage.position, isEnabled: stage.isEnabled })) })]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCRMPointRulesRecords({ businessUnitId, periodMonth, rules, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT product_code FROM crm_point_rules
       WHERE business_unit_id=$1 AND period_month=$2::date
       FOR UPDATE`,
      [businessUnitId, periodMonth]
    );
    const existingCodes = new Set(existing.rows.map((row) => row.product_code));
    const incomingCodes = new Set(rules.map((rule) => rule.productCode));

    for (const rule of rules) {
      await client.query(
        `INSERT INTO crm_point_rules (
           business_unit_id, period_month, product_code, product_name, point_type,
           unit_label, points_per_unit, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2::date,$3,$4,$5,$6,$7,$8,$8)
         ON CONFLICT (business_unit_id, period_month, product_code) DO UPDATE SET
           product_name=EXCLUDED.product_name, point_type=EXCLUDED.point_type,
           unit_label=EXCLUDED.unit_label, points_per_unit=EXCLUDED.points_per_unit,
           updated_by_user_id=EXCLUDED.updated_by_user_id, updated_at=NOW()`,
        [businessUnitId, periodMonth, rule.productCode, rule.productName, rule.pointType, rule.unitLabel, rule.pointsPerUnit, actorUserId]
      );
    }

    const removedCodes = [...existingCodes].filter((code) => !incomingCodes.has(code));
    if (removedCodes.length) {
      await client.query(
        `DELETE FROM crm_point_rules
         WHERE business_unit_id=$1 AND period_month=$2::date
           AND product_code = ANY($3::varchar[])
           AND locked_at IS NULL`,
        [businessUnitId, periodMonth, removedCodes]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_POINT_RULES_SAVED','CRM_POINT_RULES',$2,$3::jsonb)`,
      [actorUserId, String(businessUnitId), JSON.stringify({
        periodMonth,
        rules: rules.map((rule) => ({ productCode: rule.productCode, pointType: rule.pointType, pointsPerUnit: rule.pointsPerUnit })),
        removedProductCodes: removedCodes,
      })]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function saveCRMSalesPointTargetRecord({ businessUnitId, periodMonth, teamId, ownerUserId, targetSWPoints, targetRevenue, currency, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let existing;
    if (ownerUserId) {
      existing = await client.query(
        `SELECT id FROM crm_sales_point_targets WHERE business_unit_id=$1 AND period_month=$2::date AND owner_user_id=$3`,
        [businessUnitId, periodMonth, ownerUserId]
      );
    } else if (teamId) {
      existing = await client.query(
        `SELECT id FROM crm_sales_point_targets WHERE business_unit_id=$1 AND period_month=$2::date AND team_id=$3 AND owner_user_id IS NULL`,
        [businessUnitId, periodMonth, teamId]
      );
    } else {
      existing = await client.query(
        `SELECT id FROM crm_sales_point_targets WHERE business_unit_id=$1 AND period_month=$2::date AND team_id IS NULL AND owner_user_id IS NULL`,
        [businessUnitId, periodMonth]
      );
    }
    let id;
    if (existing.rows[0]) {
      id = existing.rows[0].id;
      await client.query(
        `UPDATE crm_sales_point_targets
         SET target_sw_points=$2, target_revenue=$3, currency=$4, updated_by_user_id=$5, updated_at=NOW()
         WHERE id=$1`,
        [id, targetSWPoints, targetRevenue, currency, actorUserId]
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO crm_sales_point_targets (
           business_unit_id, team_id, owner_user_id, period_month, target_sw_points,
           target_revenue, currency, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8,$8) RETURNING id`,
        [businessUnitId, teamId, ownerUserId, periodMonth, targetSWPoints, targetRevenue, currency, actorUserId]
      );
      id = inserted.rows[0].id;
    }
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_SALES_TARGET_SAVED','CRM_SALES_TARGET',$2,$3::jsonb)`,
      [actorUserId, String(id), JSON.stringify({ businessUnitId: String(businessUnitId), periodMonth, teamId, ownerUserId, targetSWPoints, targetRevenue, currency })]
    );
    await client.query('COMMIT');
    return id;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCRMCommissionPlanRecord({ businessUnitId, periodMonth, scopeType, teamId, ownerUserId, name, hardwareLAKPerPoint, status, ruleSource, tiers, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT id FROM crm_commission_plans
       WHERE business_unit_id=$1 AND period_month=$2::date
         AND scope_type=$3
         AND (($3='BU' AND team_id IS NULL AND owner_user_id IS NULL)
           OR ($3='TEAM' AND team_id=$4 AND owner_user_id IS NULL)
           OR ($3='USER' AND owner_user_id=$5 AND team_id IS NULL))
       LIMIT 1`,
      [businessUnitId, periodMonth, scopeType, teamId, ownerUserId]
    );
    let planId;
    if (current.rows[0]) {
      planId = current.rows[0].id;
      await client.query(
        `UPDATE crm_commission_plans
         SET name=$2, hardware_lak_per_point=$3, status=$4, rule_source=$5,
             updated_by_user_id=$6, updated_at=NOW()
         WHERE id=$1`,
        [planId, name, hardwareLAKPerPoint, status, ruleSource, actorUserId]
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO crm_commission_plans (
           business_unit_id, period_month, scope_type, team_id, owner_user_id,
           name, model_type, hardware_lak_per_point, status, rule_source,
           created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2::date,$3,$4,$5,$6,'SW_FINAL_TIER_HW_FIXED',$7,$8,$9,$10,$10)
         RETURNING id`,
        [businessUnitId, periodMonth, scopeType, teamId, ownerUserId, name, hardwareLAKPerPoint, status, ruleSource, actorUserId]
      );
      planId = inserted.rows[0].id;
    }
    await client.query('DELETE FROM crm_commission_tiers WHERE plan_id=$1', [planId]);
    for (const tier of tiers) {
      await client.query(
        `INSERT INTO crm_commission_tiers (
           plan_id, tier_code, name, min_sw_points, max_sw_points, lak_per_sw_point, position
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [planId, tier.tierCode, tier.name, tier.minSWPoints, tier.maxSWPoints, tier.lakPerSWPoint, tier.position]
      );
    }
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_COMMISSION_PLAN_SAVED','CRM_COMMISSION_PLAN',$2,$3::jsonb)`,
      [actorUserId, String(planId), JSON.stringify({ businessUnitId: String(businessUnitId), periodMonth, scopeType, teamId, ownerUserId, status })]
    );
    await client.query('COMMIT');
    return planId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// --- v3.1.0.0 Shared Product Master ----------------------------------------
export async function listProductMasterByBusinessUnit(businessUnitId) {
  const result = await db.query(
    `SELECT
       pm.id,
       pm.product_code,
       pm.product_name,
       pm.product_type,
       pm.category,
       pm.unit_label,
       pm.inventory_managed,
       pm.default_unit_price,
       pm.currency,
       pm.status AS master_status,
       pm.description,
       pmbu.status AS business_unit_status
     FROM product_master pm
     JOIN product_master_business_units pmbu ON pmbu.product_id = pm.id
     WHERE pmbu.business_unit_id = $1
     ORDER BY CASE WHEN pm.product_type = 'SOFTWARE' THEN 0 ELSE 1 END, pm.product_name, pm.product_code`,
    [businessUnitId]
  );
  return result.rows;
}

export async function saveProductMasterRecord({
  businessUnitId,
  productId,
  productName,
  productType,
  category,
  unitLabel,
  inventoryManaged,
  defaultUnitPrice,
  currency,
  status,
  description,
  actorUserId,
}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let id = productId || null;
    if (id) {
      const updated = await client.query(
        `UPDATE product_master
         SET product_name = $2,
             product_type = $3,
             category = $4,
             unit_label = $5,
             inventory_managed = $6,
             default_unit_price = $7,
             currency = $8,
             description = $9,
             updated_by_user_id = $10,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, product_code`,
        [id, productName, productType, category, unitLabel, inventoryManaged, defaultUnitPrice, currency, description, actorUserId]
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
    } else {
      const inserted = await client.query(
        `INSERT INTO product_master(
           product_name, product_type, category, unit_label, inventory_managed,
           default_unit_price, currency, status, description, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9,$9)
         RETURNING id, product_code`,
        [productName, productType, category, unitLabel, inventoryManaged, defaultUnitPrice, currency, description, actorUserId]
      );
      id = inserted.rows[0].id;
    }

    await client.query(
      `INSERT INTO product_master_business_units(product_id, business_unit_id, status, created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,$4)
       ON CONFLICT (product_id, business_unit_id) DO UPDATE SET
         status = EXCLUDED.status,
         updated_by_user_id = EXCLUDED.updated_by_user_id,
         updated_at = NOW()`,
      [id, businessUnitId, status, actorUserId]
    );

    const row = await client.query(
      `SELECT pm.id, pm.product_code, pm.product_name, pm.product_type, pm.category, pm.unit_label,
              pm.inventory_managed, pm.default_unit_price, pm.currency, pm.description,
              pmbu.status AS business_unit_status
       FROM product_master pm
       JOIN product_master_business_units pmbu ON pmbu.product_id = pm.id AND pmbu.business_unit_id = $2
       WHERE pm.id = $1`,
      [id, businessUnitId]
    );
    await client.query('COMMIT');
    return row.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


// --- v3.2.0.0 Shared Customer Master --------------------------------------
export async function listCustomerMasterByBusinessUnit(businessUnitId, { ownerUserId = null, ownerUserIds = null, viewAllOwners = true } = {}) {
  const params = [businessUnitId];
  let visibilitySql = '';

  if (!viewAllOwners) {
    if (Array.isArray(ownerUserIds)) {
      const ids = ownerUserIds.map((value) => Number(value)).filter((value) => Number.isFinite(value));
      if (!ids.length) {
        visibilitySql = ' AND FALSE';
      } else {
        params.push(ids);
        visibilitySql = ` AND EXISTS (
          SELECT 1 FROM crm_deals visible_deal
          WHERE visible_deal.customer_id=cm.id
            AND visible_deal.business_unit_id=$1
            AND visible_deal.owner_user_id = ANY($2::bigint[])
        )`;
      }
    } else {
      params.push(Number(ownerUserId));
      visibilitySql = ` AND EXISTS (
        SELECT 1 FROM crm_deals visible_deal
        WHERE visible_deal.customer_id=cm.id
          AND visible_deal.business_unit_id=$1
          AND visible_deal.owner_user_id=$2
      )`;
    }
  }

  const result = await db.query(
    `SELECT cm.id,
            cm.customer_code,
            cm.display_name,
            cm.legal_company_name,
            cm.customer_type,
            cm.primary_contact,
            cm.phone,
            cm.email,
            cm.whatsapp,
            cm.province,
            cm.status,
            cm.note,
            cm.created_at,
            cm.updated_at,
            COUNT(DISTINCT d.id)::int AS deal_count,
            COUNT(DISTINCT CASE WHEN d.stage='CLOSED_WON' THEN d.id END)::int AS won_deal_count,
            COALESCE(SUM(CASE WHEN d.stage='CLOSED_WON' AND d.currency='LAK' THEN d.value ELSE 0 END),0) AS won_value_lak
     FROM customer_master cm
     JOIN customer_master_business_units cmbu ON cmbu.customer_id=cm.id
     LEFT JOIN crm_deals d ON d.customer_id=cm.id AND d.business_unit_id=$1
     WHERE cmbu.business_unit_id=$1${visibilitySql}
     GROUP BY cm.id
     ORDER BY cm.status DESC, cm.display_name, cm.customer_code`,
    params
  );
  return result.rows;
}

export async function findCustomerMasterByCodeForBusinessUnit(businessUnitId, customerCode) {
  const result = await db.query(
    `SELECT cm.id,
            cm.customer_code,
            cm.display_name,
            cm.legal_company_name,
            cm.customer_type,
            cm.primary_contact,
            cm.phone,
            cm.email,
            cm.whatsapp,
            cm.province,
            cm.status,
            cm.note,
            cmbu.status AS business_unit_status
     FROM customer_master cm
     JOIN customer_master_business_units cmbu ON cmbu.customer_id=cm.id
     WHERE cmbu.business_unit_id=$1
       AND UPPER(cm.customer_code)=UPPER($2)
     LIMIT 1`,
    [businessUnitId, customerCode]
  );
  return result.rows[0] || null;
}

export async function createDealFromCustomerRecord({ businessUnitId, customer, payload, productLines, ownerUserId, actorUserId }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT cm.id, cm.customer_code, cm.display_name, cm.primary_contact, cm.status,
              cmbu.status AS business_unit_status
       FROM customer_master cm
       JOIN customer_master_business_units cmbu ON cmbu.customer_id=cm.id
       WHERE cm.id=$1 AND cmbu.business_unit_id=$2
       FOR UPDATE`,
      [customer.id, businessUnitId]
    );
    const liveCustomer = current.rows[0];
    if (!liveCustomer) {
      const error = new Error('Customer is not available in this Business Unit.');
      error.statusCode = 404;
      error.code = 'CRM_CUSTOMER_NOT_FOUND';
      throw error;
    }
    if (liveCustomer.status !== 'ACTIVE' || liveCustomer.business_unit_status !== 'ACTIVE') {
      const error = new Error('Inactive Customer cannot create a new Opportunity.');
      error.statusCode = 409;
      error.code = 'CRM_CUSTOMER_INACTIVE';
      throw error;
    }

    const result = await client.query(
      `INSERT INTO crm_deals (
         business_unit_id, source_lead_id, customer_id, customer_linked_at,
         owner_user_id, store_name, primary_contact, stage,
         value, currency, expected_close_date,
         package_code, license_quantity, software_value, hardware_value, product_note,
         created_by_user_id, updated_by_user_id
       )
       VALUES ($1, NULL, $2, NOW(), $3, $4, $5, 'NEW_DEAL', $6, $7, $8, NULL, $9, $10, $11, $12, $13, $13)
       RETURNING id, deal_code`,
      [
        businessUnitId,
        liveCustomer.id,
        ownerUserId,
        liveCustomer.display_name,
        liveCustomer.primary_contact,
        payload.value,
        payload.currency,
        payload.expectedCloseDate,
        payload.licenseQuantity,
        payload.softwareValue,
        payload.hardwareValue,
        payload.productNote,
        actorUserId,
      ]
    );
    const deal = result.rows[0];

    for (let index = 0; index < productLines.length; index += 1) {
      const line = productLines[index];
      await client.query(
        `INSERT INTO crm_deal_product_lines (
           deal_id, business_unit_id, product_code, product_name_snapshot, point_type_snapshot,
           unit_label_snapshot, inventory_managed_snapshot, quantity, unit_price, line_value,
           sort_order, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
        [
          deal.id, businessUnitId, line.productCode, line.productName, line.pointType,
          line.unitLabel, line.inventoryManaged, line.quantity, line.unitPrice, line.lineValue,
          index + 1, actorUserId,
        ]
      );
    }

    await client.query(
      `INSERT INTO crm_commissions (deal_id, business_unit_id, owner_user_id, status)
       VALUES ($1,$2,$3,'PROJECTED')
       ON CONFLICT (deal_id) DO NOTHING`,
      [deal.id, businessUnitId, ownerUserId]
    );
    await client.query(
      `INSERT INTO crm_deal_stage_history (deal_id, from_stage, to_stage, reason, actor_user_id)
       VALUES ($1,NULL,'NEW_DEAL','Existing Customer Opportunity',$2)`,
      [deal.id, actorUserId]
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,'CRM_CUSTOMER_REPEAT_DEAL_CREATED','CRM_DEAL',$2,$3::jsonb)`,
      [actorUserId, deal.deal_code, JSON.stringify({ customerCode: liveCustomer.customer_code, businessUnitId: String(businessUnitId), ownerUserId: String(ownerUserId) })]
    );

    await client.query('COMMIT');
    return deal.deal_code;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function saveCustomerMasterRecord({
  businessUnitId,
  customerId,
  displayName,
  legalCompanyName,
  customerType,
  primaryContact,
  phone,
  email,
  whatsapp,
  province,
  status,
  note,
  actorUserId,
}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    let id = customerId || null;
    if (id) {
      const access = await client.query(
        `SELECT 1 FROM customer_master_business_units WHERE customer_id=$1 AND business_unit_id=$2`,
        [id, businessUnitId]
      );
      if (!access.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
      const updated = await client.query(
        `UPDATE customer_master
         SET display_name=$2,
             legal_company_name=$3,
             customer_type=$4,
             primary_contact=$5,
             phone=$6,
             email=$7,
             whatsapp=$8,
             province=$9,
             status=$10,
             note=$11,
             updated_by_user_id=$12,
             updated_at=NOW()
         WHERE id=$1
         RETURNING id, customer_code`,
        [id, displayName, legalCompanyName, customerType, primaryContact, phone, email, whatsapp, province, status, note, actorUserId]
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }
    } else {
      const inserted = await client.query(
        `INSERT INTO customer_master(
           display_name, legal_company_name, customer_type, primary_contact, phone, email, whatsapp, province,
           status, note, created_by_user_id, updated_by_user_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
         RETURNING id, customer_code`,
        [displayName, legalCompanyName, customerType, primaryContact, phone, email, whatsapp, province, status, note, actorUserId]
      );
      id = inserted.rows[0].id;
    }

    await client.query(
      `INSERT INTO customer_master_business_units(customer_id, business_unit_id, status, created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,$4)
       ON CONFLICT (customer_id, business_unit_id) DO UPDATE SET
         status=EXCLUDED.status,
         updated_by_user_id=EXCLUDED.updated_by_user_id,
         updated_at=NOW()`,
      [id, businessUnitId, status, actorUserId]
    );

    const row = await client.query(
      `SELECT cm.id, cm.customer_code, cm.display_name, cm.legal_company_name, cm.customer_type,
              cm.primary_contact, cm.phone, cm.email, cm.whatsapp, cm.province, cm.status, cm.note,
              cm.created_at, cm.updated_at,
              COUNT(DISTINCT d.id)::int AS deal_count,
              COUNT(DISTINCT CASE WHEN d.stage='CLOSED_WON' THEN d.id END)::int AS won_deal_count,
              COALESCE(SUM(CASE WHEN d.stage='CLOSED_WON' AND d.currency='LAK' THEN d.value ELSE 0 END),0) AS won_value_lak
       FROM customer_master cm
       JOIN customer_master_business_units cmbu ON cmbu.customer_id=cm.id AND cmbu.business_unit_id=$2
       LEFT JOIN crm_deals d ON d.customer_id=cm.id AND d.business_unit_id=$2
       WHERE cm.id=$1
       GROUP BY cm.id`,
      [id, businessUnitId]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,'CUSTOMER_MASTER',$3,$4::jsonb)`,
      [actorUserId, customerId ? 'CUSTOMER_MASTER_UPDATED' : 'CUSTOMER_MASTER_CREATED', row.rows[0]?.customer_code || String(id), JSON.stringify({ businessUnitId, status })]
    );
    await client.query('COMMIT');
    return row.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

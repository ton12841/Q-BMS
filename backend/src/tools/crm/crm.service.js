import {
  createLeadRecord,
  findActiveBusinessUnitByCode,
  findLeadByCode,
  findPotentialDuplicateLeads,
  listAllActiveBusinessUnits,
  listEmployeeBusinessUnits,
  listLeads,
} from './crm.repository.js';

const LEAD_SOURCES = new Set([
  'EVENT',
  'FACEBOOK',
  'WEBSITE',
  'REFERRAL',
  'PARTNER',
  'WALK_IN',
  'OUTBOUND',
  'IMPORT',
  'OTHER',
  'OWN_LEAD',
]);

function clean(value, max = 255) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
}

function required(value, label, max = 255) {
  const text = clean(value, max);
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    error.code = 'CRM_LEAD_VALIDATION';
    throw error;
  }
  return text;
}

function canViewAll(auth) {
  return Boolean(
    auth?.sessionKind === 'DEVELOPMENT_PREVIEW' ||
    auth?.isSuperAdmin ||
    auth?.permissions?.includes('crm.lead.view_all')
  );
}

function actorUserId(auth) {
  return auth?.user?.id || null;
}

function serializeBusinessUnit(row) {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    status: row.status,
  };
}

function serializeLead(row, auth) {
  const developmentPreview = auth?.sessionKind === 'DEVELOPMENT_PREVIEW';
  return {
    id: row.lead_code,
    storeName: row.store_name,
    legalCompanyName: row.legal_company_name || undefined,
    individualName: row.individual_name || undefined,
    primaryContact: row.primary_contact,
    phone: row.phone,
    email: row.email || undefined,
    whatsapp: row.whatsapp || undefined,
    province: row.province,
    source: row.source,
    sourceDetail: row.source_detail || undefined,
    businessUnit: row.business_unit_code,
    businessUnitName: row.business_unit_name,
    project: row.project_name || undefined,
    campaign: row.campaign_name || undefined,
    owner: row.owner_display_name || (developmentPreview ? 'Development Preview' : 'Unassigned'),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    status: row.status,
    note: row.note || undefined,
    lostReason: row.lost_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCRMContextBusinessUnits(auth) {
  if (canViewAll(auth)) {
    const rows = await listAllActiveBusinessUnits();
    return rows.map(serializeBusinessUnit);
  }

  const rows = await listEmployeeBusinessUnits(auth?.user?.employeeId || null);
  return rows.map(serializeBusinessUnit);
}

async function assertBusinessUnitAccess(auth, code) {
  const businessUnit = await findActiveBusinessUnitByCode(code);
  if (!businessUnit) {
    const error = new Error('Business Unit was not found or is inactive.');
    error.statusCode = 400;
    error.code = 'CRM_BUSINESS_UNIT_INVALID';
    throw error;
  }

  if (canViewAll(auth)) return businessUnit;

  const allowed = await listEmployeeBusinessUnits(auth?.user?.employeeId || null);
  if (!allowed.some((item) => String(item.id) === String(businessUnit.id))) {
    const error = new Error('You do not have CRM access to this Business Unit.');
    error.statusCode = 403;
    error.code = 'CRM_BUSINESS_UNIT_FORBIDDEN';
    throw error;
  }

  return businessUnit;
}

export async function getCRMLeads({ auth, businessUnitCode = 'ALL', query = '' }) {
  if (businessUnitCode !== 'ALL') {
    await assertBusinessUnitAccess(auth, businessUnitCode);
  }

  const rows = await listLeads({
    businessUnitCode,
    query,
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAll(auth),
  });

  return rows.map((row) => serializeLead(row, auth));
}

export async function getCRMLead({ auth, leadCode }) {
  const row = await findLeadByCode({
    leadCode: required(leadCode, 'Lead Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAll(auth),
  });

  return row ? serializeLead(row, auth) : null;
}

function normalizeCreatePayload(input = {}) {
  const source = required(input.source, 'Source', 40).toUpperCase();
  if (!LEAD_SOURCES.has(source)) {
    const error = new Error('Lead Source is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_LEAD_SOURCE_INVALID';
    throw error;
  }

  const sourceDetail = clean(input.sourceDetail, 255);
  if (source === 'OTHER' && !sourceDetail) {
    const error = new Error('Please specify the Other Lead Source.');
    error.statusCode = 400;
    error.code = 'CRM_LEAD_SOURCE_DETAIL_REQUIRED';
    throw error;
  }

  return {
    businessUnitCode: required(input.businessUnitCode, 'Business Unit', 50).toUpperCase(),
    storeName: required(input.storeName, 'Store / Trading Name', 220),
    legalCompanyName: clean(input.legalCompanyName, 255),
    individualName: clean(input.individualName, 220),
    primaryContact: required(input.primaryContact, 'Primary Contact', 220),
    phone: required(input.phone, 'Phone', 80),
    email: clean(input.email, 255),
    whatsapp: clean(input.whatsapp, 120),
    province: required(input.province, 'Province', 160),
    source,
    sourceDetail,
    project: clean(input.project, 220),
    campaign: clean(input.campaign, 220),
    note: clean(input.note, 5000),
    status: 'NEW',
    allowDuplicate: input.allowDuplicate === true,
  };
}

export async function createCRMLead({ auth, input }) {
  const payload = normalizeCreatePayload(input);
  const businessUnit = await assertBusinessUnitAccess(auth, payload.businessUnitCode);

  const duplicates = await findPotentialDuplicateLeads({
    businessUnitId: businessUnit.id,
    phone: payload.phone,
  });

  if (duplicates.length && !payload.allowDuplicate) {
    const error = new Error('A possible duplicate Lead already exists for this phone number.');
    error.statusCode = 409;
    error.code = 'CRM_LEAD_POSSIBLE_DUPLICATE';
    error.details = {
      candidates: duplicates.map((row) => ({
        id: row.lead_code,
        storeName: row.store_name,
        primaryContact: row.primary_contact,
        status: row.status,
        owner: row.owner_display_name || 'Unassigned',
      })),
    };
    throw error;
  }

  const userId = actorUserId(auth);
  const leadCode = await createLeadRecord({
    businessUnitId: businessUnit.id,
    ownerUserId: userId,
    payload,
    actorUserId: userId,
  });

  const row = await findLeadByCode({
    leadCode,
    ownerUserId: userId,
    viewAllOwners: true,
  });

  return serializeLead(row, auth);
}

import {
  completeActivityRecord,
  createActivityRecord,
  createDealFromLeadRecord,
  createDealFromCustomerRecord,
  createLeadRecord,
  assignLeadOwnerRecord,
  findActiveBusinessUnitByCode,
  findActivityByCode,
  findDealByCode,
  findCustomerMasterByCodeForBusinessUnit,
  findLeadByCode,
  findPotentialDuplicateLeads,
  getSalesPerformanceRecord,
  getRecognizedPointSummary,
  listActivities,
  listAllActiveBusinessUnits,
  listCommissionRecords,
  listDeals,
  listEmployeeBusinessUnits,
  listLeads,
  rescheduleActivityRecord,
  replaceDealProductLinesRecord,
  processCRMIntegrationEventRecord,
  updateDealCommercialRecord,
  updateDealStageRecord,
  getCRMBUSettingsRecord,
  listCRMCommissionPlans,
  getCRMUserAccessRows,
  listCRMBUMembers,
  listCRMPointRules,
  listCRMProductReferenceRows,
  listProductMasterByBusinessUnit,
  listCustomerMasterByBusinessUnit,
  listCRMRoleDefinitions,
  listCRMSalesPointTargets,
  listCRMSalesTeams,
  listCRMSettingsUsers,
  listCRMUserMembershipUnits,
  listCRMPipelineSettings,
  saveCRMBUGeneralRecord,
  saveCRMBUMemberRecord,
  saveCRMCommissionPlanRecord,
  saveCRMPipelineSettingsRecords,
  saveCRMPointRulesRecords,
  saveProductMasterRecord,
  saveCustomerMasterRecord,
  saveCRMSalesPointTargetRecord,
  saveCRMSalesTeamRecord,
} from './crm.repository.js';

const LEAD_SOURCES = new Set([
  'EVENT', 'FACEBOOK', 'WEBSITE', 'REFERRAL', 'PARTNER',
  'WALK_IN', 'OUTBOUND', 'IMPORT', 'OTHER', 'OWN_LEAD',
]);

const ACTIVITY_TYPES = new Set([
  'CALL', 'VISIT', 'MEETING', 'DEMO', 'FOLLOW_UP',
  'QUOTATION', 'CONTRACT', 'PAYMENT',
]);

const ACTIVITY_PURPOSES = {
  CALL: new Set(['FIRST_CONTACT', 'FOLLOW_UP', 'PRODUCT_INTRODUCTION', 'PRICE_FOLLOW_UP', 'APPOINTMENT', 'PAYMENT_FOLLOW_UP', 'OTHER']),
  VISIT: new Set(['FIRST_VISIT', 'STORE_SURVEY', 'FOLLOW_UP', 'PRODUCT_PRESENTATION', 'RELATIONSHIP_VISIT', 'OTHER']),
  MEETING: new Set(['REQUIREMENT_DISCUSSION', 'SOLUTION_DISCUSSION', 'PRICING', 'COMMERCIAL_DISCUSSION', 'CONTRACT_DISCUSSION', 'OTHER']),
  DEMO: new Set(['PRODUCT_DEMO', 'QSR_DEMO', 'FSR_DEMO', 'HANDHELD_DEMO', 'FEATURE_DEMO', 'RE_DEMO', 'OTHER']),
  FOLLOW_UP: new Set(['AFTER_CALL', 'AFTER_VISIT', 'AFTER_DEMO', 'AFTER_QUOTATION', 'AFTER_MEETING', 'CUSTOMER_DECISION', 'OTHER']),
  QUOTATION: new Set(['PREPARE_QUOTATION', 'SEND_QUOTATION', 'REVISE_QUOTATION', 'QUOTATION_FOLLOW_UP', 'OTHER']),
  CONTRACT: new Set(['PREPARE_CONTRACT', 'SEND_CONTRACT', 'CONTRACT_REVISION', 'SIGNATURE_FOLLOW_UP', 'OTHER']),
  PAYMENT: new Set(['PAYMENT_REMINDER', 'PAYMENT_CONFIRMATION', 'PAYMENT_ISSUE', 'PAYMENT_SLIP_FOLLOW_UP', 'OTHER']),
};

const OUTCOMES = {
  CALL: new Set(['CONNECTED', 'NO_ANSWER', 'BUSY', 'WRONG_NUMBER', 'NEED_FOLLOW_UP']),
  VISIT: new Set(['COMPLETED', 'CUSTOMER_UNAVAILABLE', 'NEED_FOLLOW_UP', 'RESCHEDULE']),
  MEETING: new Set(['COMPLETED', 'CUSTOMER_NO_SHOW', 'NEED_FOLLOW_UP', 'RESCHEDULE']),
  DEMO: new Set(['INTERESTED', 'NEED_FOLLOW_UP', 'NEED_QUOTATION', 'NOT_INTERESTED', 'NEED_ANOTHER_DEMO']),
  FOLLOW_UP: new Set(['PROGRESSING', 'WAITING_CUSTOMER', 'NEED_MORE_INFORMATION', 'NO_RESPONSE', 'FOLLOW_UP']),
  QUOTATION: new Set(['PREPARED', 'SENT', 'REVISION_REQUIRED', 'FOLLOW_UP_REQUIRED']),
  CONTRACT: new Set(['PREPARED', 'SENT', 'REVISION_REQUIRED', 'FOLLOW_UP_REQUIRED']),
  PAYMENT: new Set(['AWAITING_PAYMENT', 'PROMISE_TO_PAY', 'PAYMENT_ISSUE', 'NO_RESPONSE', 'FOLLOW_UP_REQUIRED']),
};

const DEAL_STAGES = new Set([
  'NEW_DEAL', 'DEMO', 'QUOTATION', 'NEGOTIATION',
  'CONTRACT', 'AWAITING_PAYMENT', 'CLOSED_WON', 'CLOSED_LOST',
]);
const CURRENCIES = new Set(['LAK', 'USD', 'THB']);


const TEMPORARY_CRM_PRODUCT_OPTIONS = {
  QPOS: [
    { productCode: 'PRD-0001', productName: 'QPOS Handheld', pointType: 'SOFTWARE', unitLabel: 'License / Year', inventoryManaged: false, defaultUnitPrice: 3000000, currency: 'LAK' },
    { productCode: 'PRD-0002', productName: 'QPOS QSR', pointType: 'SOFTWARE', unitLabel: 'License / Year', inventoryManaged: false, defaultUnitPrice: 5000000, currency: 'LAK' },
    { productCode: 'PRD-0003', productName: 'QPOS FSR', pointType: 'SOFTWARE', unitLabel: 'License / Year', inventoryManaged: false, defaultUnitPrice: 7000000, currency: 'LAK' },
    { productCode: 'PRD-0004', productName: 'QPOS Buffet', pointType: 'SOFTWARE', unitLabel: 'License / Year', inventoryManaged: false, defaultUnitPrice: 9000000, currency: 'LAK' },
    { productCode: 'PRD-0005', productName: 'SUNMI P2', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 5500000, currency: 'LAK' },
    { productCode: 'PRD-0006', productName: 'SUNMI V3E', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 6900000, currency: 'LAK' },
    { productCode: 'PRD-0007', productName: 'SUNMI D3 Single Screen', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 12900000, currency: 'LAK' },
    { productCode: 'PRD-0008', productName: 'SUNMI D3 Dual Screen', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 14900000, currency: 'LAK' },
    { productCode: 'PRD-0009', productName: 'Printer', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 1590000, currency: 'LAK' },
    { productCode: 'PRD-0010', productName: 'Cash Drawer', pointType: 'HARDWARE', unitLabel: 'Unit', inventoryManaged: true, defaultUnitPrice: 1290000, currency: 'LAK' },
  ],
};

function resolveCRMProductOptions(businessUnitCode, existingPointRules = []) {
  const code = String(businessUnitCode || '').trim().toUpperCase();
  const seeded = TEMPORARY_CRM_PRODUCT_OPTIONS[code] || [];
  const merged = new Map();

  for (const product of seeded) {
    merged.set(product.productCode, {
      ...product,
      source: 'TEMPORARY_SEED',
      status: 'ACTIVE',
    });
  }

  // Preserve compatibility for any BU/product that already has a point rule even when it
  // is not part of the temporary QPOS seed. When Product Master is available, this
  // resolver is the integration seam that will be replaced by Product Master data.
  for (const rule of existingPointRules) {
    const productCode = String(rule.product_code || '').trim().toUpperCase();
    if (!productCode || merged.has(productCode)) continue;
    merged.set(productCode, {
      productCode,
      productName: rule.product_name,
      pointType: rule.point_type,
      unitLabel: rule.unit_label || undefined,
      inventoryManaged: rule.point_type === 'HARDWARE',
      source: 'EXISTING_POINT_RULE',
      status: 'ACTIVE',
    });
  }

  return [...merged.values()].sort((a, b) => {
    const typeOrder = (a.pointType === 'SOFTWARE' ? 0 : 1) - (b.pointType === 'SOFTWARE' ? 0 : 1);
    return typeOrder || String(a.productName).localeCompare(String(b.productName));
  });
}

function serializeCRMProductOption(product) {
  return {
    productCode: product.productCode,
    productName: product.productName,
    pointType: product.pointType,
    unitLabel: product.unitLabel || undefined,
    inventoryManaged: Boolean(product.inventoryManaged),
    defaultUnitPrice: product.defaultUnitPrice == null ? undefined : Number(product.defaultUnitPrice),
    currency: product.currency || 'LAK',
    source: product.source,
    status: product.status || 'ACTIVE',
  };
}

async function crmProductOptionsForBusinessUnit(businessUnit) {
  const masterRows = await listProductMasterByBusinessUnit(businessUnit.id);
  if (masterRows.length) {
    return masterRows.map((row) => ({
      id: String(row.id),
      productCode: row.product_code,
      productName: row.product_name,
      pointType: row.product_type,
      category: row.category || undefined,
      unitLabel: row.unit_label || undefined,
      inventoryManaged: Boolean(row.inventory_managed),
      defaultUnitPrice: Number(row.default_unit_price || 0),
      currency: row.currency || 'LAK',
      description: row.description || undefined,
      source: 'PRODUCT_MASTER',
      status: row.master_status === 'INACTIVE' || row.business_unit_status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    }));
  }
  const references = await listCRMProductReferenceRows(businessUnit.id);
  return resolveCRMProductOptions(businessUnit.code, references).map(serializeCRMProductOption);
}

export async function getCRMProductOptions({ auth, businessUnitCode }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  const canReadDeals = authHasPermission(auth, 'crm.deal.view') ||
    await hasCRMCapability(auth, bu.code, 'deal.self.view') ||
    await hasCRMCapability(auth, bu.code, 'deal.team.view') ||
    await hasCRMCapability(auth, bu.code, 'deal.shared.view');
  if (!canReadDeals) {
    const error = new Error('CRM Deal access is required to select products.');
    error.statusCode = 403;
    error.code = 'CRM_PRODUCT_SELECTOR_FORBIDDEN';
    throw error;
  }
  return crmProductOptionsForBusinessUnit(bu);
}

async function normalizeDealProductLinesForBU(businessUnit, rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    const error = new Error('Add at least one Product to the Deal.');
    error.statusCode = 400;
    error.code = 'CRM_DEAL_PRODUCTS_REQUIRED';
    throw error;
  }
  if (rawLines.length > 100) {
    const error = new Error('A Deal can contain at most 100 Product Lines.');
    error.statusCode = 400;
    error.code = 'CRM_DEAL_PRODUCTS_LIMIT';
    throw error;
  }
  const options = await crmProductOptionsForBusinessUnit(businessUnit);
  const byCode = new Map(options.filter((option) => option.status === 'ACTIVE').map((option) => [option.productCode, option]));
  const seen = new Set();
  return rawLines.map((raw, index) => {
    const productCode = required(raw?.productCode, `Product ${index + 1}`, 60).toUpperCase();
    const product = byCode.get(productCode);
    if (!product) {
      const error = new Error(`Product ${productCode} is not available in the controlled Product Selector.`);
      error.statusCode = 400;
      error.code = 'CRM_DEAL_PRODUCT_INVALID';
      throw error;
    }
    if (seen.has(productCode)) {
      const error = new Error(`${product.productName} is already added to this Deal. Edit its Quantity instead of adding it twice.`);
      error.statusCode = 400;
      error.code = 'CRM_DEAL_PRODUCT_DUPLICATE';
      throw error;
    }
    seen.add(productCode);
    const quantity = wholeNumber(raw?.quantity ?? 1, 'Product Quantity', { min: 1, max: 100000 });
    const unitPrice = nonNegativeNumber(raw?.unitPrice ?? product.defaultUnitPrice ?? 0, 'Unit Price');
    return {
      productCode: product.productCode,
      productName: product.productName,
      pointType: product.pointType,
      unitLabel: product.unitLabel || null,
      inventoryManaged: Boolean(product.inventoryManaged),
      quantity,
      unitPrice,
      lineValue: quantity * unitPrice,
    };
  });
}

function summarizeDealProductLines(productLines) {
  const softwareValue = productLines
    .filter((line) => line.pointType === 'SOFTWARE')
    .reduce((sum, line) => sum + Number(line.lineValue || 0), 0);
  const hardwareValue = productLines
    .filter((line) => line.pointType === 'HARDWARE')
    .reduce((sum, line) => sum + Number(line.lineValue || 0), 0);
  const softwareQuantity = productLines
    .filter((line) => line.pointType === 'SOFTWARE')
    .reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  return {
    softwareValue,
    hardwareValue,
    value: softwareValue + hardwareValue,
    licenseQuantity: Math.max(1, softwareQuantity),
  };
}

function clean(value, max = 255) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
}

function required(value, label, max = 255) {
  const text = clean(value, max);
  if (!text) {
    const error = new Error(`${label} is required.`);
    error.statusCode = 400;
    error.code = 'CRM_VALIDATION';
    throw error;
  }
  return text;
}

function futureDate(value, label = 'Schedule') {
  const raw = required(value, label, 80);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${label} is invalid.`);
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_SCHEDULE_INVALID';
    throw error;
  }
  if (parsed.getTime() <= Date.now()) {
    const error = new Error(`${label} must be in the future.`);
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_SCHEDULE_PAST';
    throw error;
  }
  return parsed.toISOString();
}

function actorUserId(auth) {
  return auth?.user?.id || null;
}

function elevated(auth, permission) {
  return Boolean(
    auth?.sessionKind === 'DEVELOPMENT_PREVIEW' ||
    auth?.isSuperAdmin ||
    auth?.permissions?.includes(permission)
  );
}

function canViewAllLeads(auth) {
  return elevated(auth, 'crm.lead.view_all');
}

function canViewAllDeals(auth) {
  return elevated(auth, 'crm.deal.view_all') || canViewAllLeads(auth);
}

function canViewAllActivities(auth) {
  return elevated(auth, 'crm.activity.view_all') || canViewAllDeals(auth);
}

function serializeBusinessUnit(row) {
  return { id: String(row.id), code: row.code, name: row.name, status: row.status };
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
    nextActivity: row.next_activity_type || undefined,
    nextActivityAt: row.next_activity_at || undefined,
    note: row.note || undefined,
    lostReason: row.lost_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeDeal(row, auth) {
  const developmentPreview = auth?.sessionKind === 'DEVELOPMENT_PREVIEW';
  return {
    id: row.deal_code,
    sourceLeadCode: row.source_lead_code || undefined,
    storeName: row.store_name,
    primaryContact: row.primary_contact || undefined,
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    customerCode: row.customer_code || undefined,
    customerName: row.customer_name || undefined,
    customerLinkedAt: row.customer_linked_at || undefined,
    businessUnit: row.business_unit_code,
    businessUnitName: row.business_unit_name,
    owner: row.owner_display_name || (developmentPreview ? 'Development Preview' : 'Unassigned'),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    stage: row.stage,
    value: Number(row.value || 0),
    currency: row.currency,
    expectedCloseDate: row.expected_close_date || undefined,
    packageCode: row.package_code || undefined,
    licenseQuantity: Number(row.license_quantity || 1),
    softwareValue: Number(row.software_value || 0),
    hardwareValue: Number(row.hardware_value || 0),
    productNote: row.product_note || undefined,
    closedWonAt: row.closed_won_at || undefined,
    closedLostAt: row.closed_lost_at || undefined,
    nextActivity: row.next_activity_type || undefined,
    nextActivityAt: row.next_activity_at || undefined,
    quotationNumber: row.quotation_number || undefined,
    quotationConfirmed: Boolean(row.quotation_confirmed_at),
    paymentSlipUploaded: Boolean(row.payment_slip_uploaded_at),
    financePaymentConfirmed: Boolean(row.finance_payment_confirmed_at),
    invoiceNumber: row.invoice_number || undefined,
    productLines: Array.isArray(row.product_lines) ? row.product_lines.map((line) => ({
      ...line,
      quantity: Number(line.quantity || 0),
      unitPrice: Number(line.unitPrice || 0),
      lineValue: Number(line.lineValue || 0),
      inventoryManaged: Boolean(line.inventoryManaged),
    })) : [],
    pointRecognition: row.point_recognition ? {
      ...row.point_recognition,
      swPoints: Number(row.point_recognition.swPoints || 0),
      hwPoints: Number(row.point_recognition.hwPoints || 0),
      amountLAK: Number(row.point_recognition.amountLAK || 0),
      lineSnapshots: Array.isArray(row.point_recognition.lineSnapshots) ? row.point_recognition.lineSnapshots.map((line) => ({
        ...line,
        quantity: Number(line.quantity || 0),
        pointsPerUnit: Number(line.pointsPerUnit || 0),
        totalPoints: Number(line.totalPoints || 0),
      })) : [],
    } : undefined,
    lostReason: row.lost_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function activityRuntimeStatus(row) {
  if (row.status === 'COMPLETED' || row.status === 'CANCELLED') return row.status;
  return new Date(row.scheduled_at).getTime() < Date.now() ? 'OVERDUE' : row.status;
}

function activityBucket(row) {
  const status = activityRuntimeStatus(row);
  if (status === 'OVERDUE') return 'OVERDUE';
  if (!['SCHEDULED', 'RESCHEDULED'].includes(row.status)) return undefined;
  const scheduled = new Date(row.scheduled_at);
  const now = new Date();
  const sameDay =
    scheduled.getFullYear() === now.getFullYear() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getDate() === now.getDate();
  return sameDay ? 'TODAY' : undefined;
}

function serializeActivity(row, auth) {
  const developmentPreview = auth?.sessionKind === 'DEVELOPMENT_PREVIEW';
  const relatedType = row.deal_id ? 'DEAL' : 'LEAD';
  return {
    id: row.activity_code,
    type: row.activity_type,
    subject: row.subject,
    purposeCode: row.purpose_code || undefined,
    purposeDetail: row.purpose_detail || undefined,
    relatedName: row.store_name,
    relatedType,
    leadCode: row.lead_code || undefined,
    dealCode: row.deal_code || undefined,
    primaryContact: row.primary_contact || undefined,
    businessUnit: row.business_unit_code,
    businessUnitName: row.business_unit_name,
    owner: row.owner_display_name || (developmentPreview ? 'Development Preview' : 'Unassigned'),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
    scheduledAt: row.scheduled_at,
    status: activityRuntimeStatus(row),
    storedStatus: row.status,
    bucket: activityBucket(row),
    outcome: row.outcome || undefined,
    note: row.purpose_note || undefined,
    resultNote: row.result_note || undefined,
    rescheduleReason: row.reschedule_reason || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCRMContextBusinessUnits(auth) {
  if (canViewAllLeads(auth) || canViewAllDeals(auth) || canViewAllActivities(auth)) {
    return (await listAllActiveBusinessUnits()).map(serializeBusinessUnit);
  }

  // CRM membership becomes the Tool-level BU source once configured.
  // Until BMS Access Provisioning is connected, fall back to Employee Organization BU
  // so the existing CRM does not lock current users out.
  const crmUnits = await listCRMUserMembershipUnits(actorUserId(auth));
  if (crmUnits.length) return crmUnits.map(serializeBusinessUnit);

  return (await listEmployeeBusinessUnits(auth?.user?.employeeId || null)).map(serializeBusinessUnit);
}

async function assertBusinessUnitAccess(auth, code) {
  const businessUnit = await findActiveBusinessUnitByCode(code);
  if (!businessUnit) {
    const error = new Error('Business Unit was not found or is inactive.');
    error.statusCode = 400;
    error.code = 'CRM_BUSINESS_UNIT_INVALID';
    throw error;
  }
  if (canViewAllLeads(auth) || canViewAllDeals(auth) || canViewAllActivities(auth)) return businessUnit;

  const crmUnits = await listCRMUserMembershipUnits(actorUserId(auth));
  const allowed = crmUnits.length
    ? crmUnits
    : await listEmployeeBusinessUnits(auth?.user?.employeeId || null);

  if (!allowed.some((item) => String(item.id) === String(businessUnit.id))) {
    const error = new Error('You do not have CRM access to this Business Unit.');
    error.statusCode = 403;
    error.code = 'CRM_BUSINESS_UNIT_FORBIDDEN';
    throw error;
  }
  return businessUnit;
}

export async function getCRMLeads({ auth, businessUnitCode = 'ALL', query = '', scope = 'AUTO' }) {
  const requestedScope = String(scope || 'AUTO').toUpperCase();
  const businessUnit = businessUnitCode !== 'ALL' ? await assertBusinessUnitAccess(auth, businessUnitCode) : null;
  const visibility = await resolveCRMDataVisibility({
    auth, businessUnit, requestedScope,
    globalViewAll: canViewAllLeads(auth),
    sharedCapability: 'lead.shared.view',
    teamCapability: 'lead.team.view',
  });
  return (await listLeads({
    businessUnitCode,
    query,
    ownerUserId: actorUserId(auth),
    ownerUserIds: visibility.ownerUserIds,
    viewAllOwners: visibility.viewAllOwners,
  })).map((row) => serializeLead(row, auth));
}

export async function getCRMLead({ auth, leadCode }) {
  const row = await findLeadByCode({
    leadCode: required(leadCode, 'Lead Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllLeads(auth),
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
    assignmentMode: String(input.assignmentMode || 'SELF').trim().toUpperCase() === 'UNASSIGNED' ? 'UNASSIGNED' : 'SELF',
  };
}

export async function createCRMLead({ auth, input }) {
  const payload = normalizeCreatePayload(input);
  const businessUnit = await assertBusinessUnitAccess(auth, payload.businessUnitCode);
  const canCreate = authHasPermission(auth, 'crm.lead.manage') ||
    await hasCRMCapability(auth, businessUnit.code, 'lead.self.manage') ||
    await hasCRMCapability(auth, businessUnit.code, 'lead.shared.create') ||
    await hasCRMCapability(auth, businessUnit.code, 'lead.assign');
  if (!canCreate) {
    const error = new Error('CRM permission required to create a Lead.');
    error.statusCode = 403;
    error.code = 'CRM_LEAD_CREATE_FORBIDDEN';
    throw error;
  }
  const duplicates = await findPotentialDuplicateLeads({ businessUnitId: businessUnit.id, phone: payload.phone });
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
  let ownerUserId = userId;
  if (payload.assignmentMode === 'UNASSIGNED') {
    await requireCRMCapability(auth, businessUnit.code, 'lead.assign');
    ownerUserId = null;
    payload.status = 'UNASSIGNED';
  }
  const leadCode = await createLeadRecord({
    businessUnitId: businessUnit.id,
    ownerUserId,
    payload,
    actorUserId: userId,
  });
  const row = await findLeadByCode({ leadCode, ownerUserId: userId, viewAllOwners: true });
  return serializeLead(row, auth);
}


export async function assignCRMLeadOwner({ auth, leadCode, input }) {
  const code = required(leadCode, 'Lead Code', 32);
  const lead = await findLeadByCode({ leadCode: code, ownerUserId: actorUserId(auth), viewAllOwners: true });
  if (!lead) {
    const error = new Error('CRM Lead not found.');
    error.statusCode = 404;
    error.code = 'CRM_LEAD_NOT_FOUND';
    throw error;
  }

  const bu = await assertBusinessUnitAccess(auth, lead.business_unit_code);
  await requireCRMCapability(auth, bu.code, 'lead.assign');

  if (['CONVERTED', 'LOST'].includes(lead.status)) {
    const error = new Error('Closed or converted Lead cannot be reassigned.');
    error.statusCode = 409;
    error.code = 'CRM_LEAD_ASSIGNMENT_LOCKED';
    throw error;
  }

  let ownerUserId = null;
  if (input.ownerUserId !== null && input.ownerUserId !== undefined && String(input.ownerUserId).trim() !== '') {
    ownerUserId = wholeNumber(input.ownerUserId, 'Owner User ID', { min: 1, max: Number.MAX_SAFE_INTEGER });
    const members = await listCRMBUMembers(bu.id);
    const activeMember = members.find((member) => String(member.user_id) === String(ownerUserId) && member.status === 'ACTIVE');
    if (!activeMember) {
      const error = new Error('Lead Owner must be an active CRM member of this Business Unit.');
      error.statusCode = 400;
      error.code = 'CRM_LEAD_OWNER_INVALID';
      throw error;
    }
  }

  await assignLeadOwnerRecord({ leadId: lead.id, ownerUserId, actorUserId: actorUserId(auth) });
  const row = await findLeadByCode({ leadCode: code, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeLead(row, auth);
}

function serializeCustomerMaster(row) {
  return {
    id: String(row.id),
    customerCode: row.customer_code,
    displayName: row.display_name,
    legalCompanyName: row.legal_company_name || undefined,
    customerType: row.customer_type,
    primaryContact: row.primary_contact || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    whatsapp: row.whatsapp || undefined,
    province: row.province || undefined,
    status: row.status,
    note: row.note || undefined,
    dealCount: Number(row.deal_count || 0),
    wonDealCount: Number(row.won_deal_count || 0),
    wonValueLAK: Number(row.won_value_lak || 0),
  };
}

export async function getCRMCustomers({ auth, businessUnitCode = 'ALL', scope = 'AUTO' }) {
  if (!businessUnitCode || businessUnitCode === 'ALL') {
    const error = new Error('Select a Business Unit to view Customers.');
    error.statusCode = 400;
    error.code = 'CRM_CUSTOMER_BUSINESS_UNIT_REQUIRED';
    throw error;
  }

  const requestedScope = String(scope || 'AUTO').toUpperCase();
  const businessUnit = await assertBusinessUnitAccess(auth, businessUnitCode);
  const visibility = await resolveCRMDataVisibility({
    auth, businessUnit, requestedScope,
    globalViewAll: canViewAllDeals(auth),
    sharedCapability: 'deal.shared.view',
    teamCapability: 'deal.team.view',
  });
  const rows = await listCustomerMasterByBusinessUnit(businessUnit.id, {
    ownerUserId: actorUserId(auth),
    ownerUserIds: visibility.ownerUserIds,
    viewAllOwners: visibility.viewAllOwners,
  });
  return rows.map(serializeCustomerMaster);
}

export async function createCRMCustomerDeal({ auth, businessUnitCode, customerCode, input }) {
  const code = required(customerCode, 'Customer Code', 32).toUpperCase();
  const businessUnit = await assertBusinessUnitAccess(auth, businessUnitCode);
  const visibleCustomers = await getCRMCustomers({ auth, businessUnitCode: businessUnit.code, scope: 'AUTO' });
  if (!visibleCustomers.some((item) => String(item.customerCode).toUpperCase() === code)) {
    const error = new Error('Customer not found or not accessible in your CRM scope.');
    error.statusCode = 404;
    error.code = 'CRM_CUSTOMER_NOT_FOUND';
    throw error;
  }

  const customer = await findCustomerMasterByCodeForBusinessUnit(businessUnit.id, code);
  if (!customer) {
    const error = new Error('Customer Master record not found.');
    error.statusCode = 404;
    error.code = 'CRM_CUSTOMER_NOT_FOUND';
    throw error;
  }
  if (customer.status !== 'ACTIVE' || customer.business_unit_status !== 'ACTIVE') {
    const error = new Error('Inactive Customer cannot create a new Opportunity.');
    error.statusCode = 409;
    error.code = 'CRM_CUSTOMER_INACTIVE';
    throw error;
  }

  const ownerUserId = actorUserId(auth);
  if (!ownerUserId) {
    const error = new Error('Authenticated CRM user is required.');
    error.statusCode = 401;
    error.code = 'CRM_USER_REQUIRED';
    throw error;
  }
  const productLines = await normalizeDealProductLinesForBU(businessUnit, input?.productLines);
  const totals = summarizeDealProductLines(productLines);
  const payload = normalizeDealConversion(input || {}, totals);
  const dealCode = await createDealFromCustomerRecord({
    businessUnitId: businessUnit.id,
    customer,
    payload,
    productLines,
    ownerUserId,
    actorUserId: ownerUserId,
  });
  const row = await findDealByCode({ dealCode, ownerUserId, viewAllOwners: true });
  return serializeDeal(row, auth);
}

export async function getCRMDeals({ auth, businessUnitCode = 'ALL', query = '', scope = 'AUTO' }) {
  const requestedScope = String(scope || 'AUTO').toUpperCase();
  const businessUnit = businessUnitCode !== 'ALL' ? await assertBusinessUnitAccess(auth, businessUnitCode) : null;
  const visibility = await resolveCRMDataVisibility({
    auth, businessUnit, requestedScope,
    globalViewAll: canViewAllDeals(auth),
    sharedCapability: 'deal.shared.view',
    teamCapability: 'deal.team.view',
  });
  return (await listDeals({
    businessUnitCode,
    query,
    ownerUserId: actorUserId(auth),
    ownerUserIds: visibility.ownerUserIds,
    viewAllOwners: visibility.viewAllOwners,
  })).map((row) => serializeDeal(row, auth));
}

export async function getCRMDeal({ auth, dealCode }) {
  const row = await findDealByCode({
    dealCode: required(dealCode, 'Deal Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllDeals(auth),
  });
  return row ? serializeDeal(row, auth) : null;
}

function numberValue(value, label) {
  const raw = value === '' || value == null ? 0 : Number(value);
  if (!Number.isFinite(raw) || raw < 0) {
    const error = new Error(`${label} must be zero or greater.`);
    error.statusCode = 400;
    error.code = 'CRM_DEAL_VALUE_INVALID';
    throw error;
  }
  return raw;
}

function normalizeDealConversion(input = {}, totals = null) {
  const currency = (clean(input.currency, 3) || 'LAK').toUpperCase();
  if (!CURRENCIES.has(currency)) {
    const error = new Error('Deal Currency is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_DEAL_CURRENCY_INVALID';
    throw error;
  }
  const expectedCloseDate = clean(input.expectedCloseDate, 10);
  if (expectedCloseDate && !/^\d{4}-\d{2}-\d{2}$/.test(expectedCloseDate)) {
    const error = new Error('Expected Close Date is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_DEAL_CLOSE_DATE_INVALID';
    throw error;
  }
  const computed = totals || {
    value: numberValue(input.value, 'Deal Value'),
    softwareValue: numberValue(input.softwareValue, 'Software Value'),
    hardwareValue: numberValue(input.hardwareValue, 'Hardware Value'),
    licenseQuantity: Math.max(1, Number(input.licenseQuantity || 1)),
  };
  return {
    value: computed.value,
    currency,
    expectedCloseDate,
    packageCode: null,
    licenseQuantity: computed.licenseQuantity,
    softwareValue: computed.softwareValue,
    hardwareValue: computed.hardwareValue,
    productNote: clean(input.productNote, 5000),
  };
}

async function assertLeadForDeal(auth, leadCode) {
  const row = await findLeadByCode({
    leadCode: required(leadCode, 'Lead Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllDeals(auth) || canViewAllLeads(auth),
  });
  if (!row) {
    const error = new Error('CRM Lead not found or not accessible.');
    error.statusCode = 404;
    error.code = 'CRM_LEAD_NOT_FOUND';
    throw error;
  }
  await assertBusinessUnitAccess(auth, row.business_unit_code);
  return row;
}

export async function convertCRMLeadToDeal({ auth, leadCode, input }) {
  const lead = await assertLeadForDeal(auth, leadCode);
  if (lead.status === 'CONVERTED') {
    const error = new Error('Lead is already converted to a Deal.');
    error.statusCode = 409;
    error.code = 'CRM_LEAD_ALREADY_CONVERTED';
    throw error;
  }
  if (lead.status === 'LOST') {
    const error = new Error('Lost Lead cannot be converted to a Deal.');
    error.statusCode = 409;
    error.code = 'CRM_LEAD_LOST';
    throw error;
  }
  const businessUnit = await assertBusinessUnitAccess(auth, lead.business_unit_code);
  const productLines = await normalizeDealProductLinesForBU(businessUnit, input.productLines);
  const totals = summarizeDealProductLines(productLines);
  const payload = normalizeDealConversion(input, totals);
  const dealCode = await createDealFromLeadRecord({
    lead,
    payload,
    productLines,
    actorUserId: actorUserId(auth),
  });
  const row = await findDealByCode({ dealCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeDeal(row, auth);
}

async function getAccessibleDeal(auth, dealCode) {
  const row = await findDealByCode({
    dealCode: required(dealCode, 'Deal Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllDeals(auth),
  });
  if (!row) {
    const error = new Error('CRM Deal not found or not accessible.');
    error.statusCode = 404;
    error.code = 'CRM_DEAL_NOT_FOUND';
    throw error;
  }
  await assertBusinessUnitAccess(auth, row.business_unit_code);
  return row;
}

function validateDealStageChange(deal, stage, input = {}) {
  if (!DEAL_STAGES.has(stage)) {
    const error = new Error('Deal Stage is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_DEAL_STAGE_INVALID';
    throw error;
  }
  if (deal.stage === 'CLOSED_WON' || deal.stage === 'CLOSED_LOST') {
    const error = new Error('Closed Deal cannot be moved manually.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_ALREADY_CLOSED';
    throw error;
  }
  if (stage === 'CLOSED_WON') {
    const error = new Error('Closed Won is system-controlled after Finance confirmation and Invoice return.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_CLOSED_WON_SYSTEM_ONLY';
    throw error;
  }
  if (stage === 'QUOTATION' && !deal.quotation_number) {
    const error = new Error('Create and link a Quotation before moving this Deal to Quotation.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_QUOTATION_REQUIRED';
    throw error;
  }
  if (stage === 'AWAITING_PAYMENT' && (!deal.quotation_number || !deal.quotation_confirmed_at)) {
    const error = new Error('Customer-confirmed Quotation is required before Awaiting Payment.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_QUOTATION_CONFIRM_REQUIRED';
    throw error;
  }
  return stage === 'CLOSED_LOST'
    ? required(input.lostReason ?? input.reason, 'Lost Reason', 255)
    : clean(input.reason, 1000);
}

export async function changeCRMDealStage({ auth, dealCode, input }) {
  const deal = await getAccessibleDeal(auth, dealCode);
  const stage = required(input.stage, 'Deal Stage', 40).toUpperCase();
  const reason = validateDealStageChange(deal, stage, input);
  if (stage === deal.stage) return serializeDeal(deal, auth);

  await updateDealStageRecord({ deal, toStage: stage, reason, actorUserId: actorUserId(auth) });
  const row = await findDealByCode({ dealCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeDeal(row, auth);
}


export async function updateCRMDeal({ auth, dealCode, input }) {
  const deal = await getAccessibleDeal(auth, dealCode);
  if (['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) {
    const error = new Error('Closed Deal commercial facts cannot be edited from Sales CRM.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_ALREADY_CLOSED';
    throw error;
  }
  // Product totals are controlled by Deal Product Lines. This endpoint updates only
  // non-line commercial metadata and preserves current derived totals.
  const payload = normalizeDealConversion({
    currency: input.currency ?? deal.currency,
    expectedCloseDate: input.expectedCloseDate ?? deal.expected_close_date,
    productNote: input.productNote ?? deal.product_note,
  }, {
    value: Number(deal.value || 0),
    softwareValue: Number(deal.software_value || 0),
    hardwareValue: Number(deal.hardware_value || 0),
    licenseQuantity: Number(deal.license_quantity || 1),
  });
  await updateDealCommercialRecord({ deal, payload, actorUserId: actorUserId(auth) });
  const row = await findDealByCode({ dealCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeDeal(row, auth);
}

export async function saveCRMDealProductLines({ auth, dealCode, input }) {
  const deal = await getAccessibleDeal(auth, dealCode);
  if (['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) {
    const error = new Error('Closed Deal product lines are locked.');
    error.statusCode = 409;
    error.code = 'CRM_DEAL_ALREADY_CLOSED';
    throw error;
  }
  const businessUnit = await assertBusinessUnitAccess(auth, deal.business_unit_code);
  const productLines = await normalizeDealProductLinesForBU(businessUnit, input.productLines ?? input.lines);
  const totals = summarizeDealProductLines(productLines);
  await replaceDealProductLinesRecord({
    deal,
    productLines,
    totals,
    actorUserId: actorUserId(auth),
  });
  const row = await findDealByCode({ dealCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeDeal(row, auth);
}


function normalizeActivityPayload(input = {}) {
  const type = required(input.type, 'Activity Type', 40).toUpperCase();
  if (!ACTIVITY_TYPES.has(type)) {
    const error = new Error('Activity Type is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_TYPE_INVALID';
    throw error;
  }
  const legacySubject = clean(input.subject, 255);
  const purposeCode = (clean(input.purposeCode, 80) || (legacySubject ? 'OTHER' : null))?.toUpperCase();
  const allowedPurposes = ACTIVITY_PURPOSES[type];
  if (!purposeCode || !allowedPurposes?.has(purposeCode)) {
    const error = new Error('Purpose is invalid for this Activity Type.');
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_PURPOSE_INVALID';
    throw error;
  }
  const purposeDetail = clean(input.purposeDetail, 255) || (purposeCode === 'OTHER' ? legacySubject : null);
  if (purposeCode === 'OTHER' && !purposeDetail) {
    const error = new Error('Please specify the Activity Purpose.');
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_PURPOSE_DETAIL_REQUIRED';
    throw error;
  }
  return {
    type,
    purposeCode,
    purposeDetail: purposeCode === 'OTHER' ? purposeDetail : null,
    subject: purposeCode === 'OTHER' ? purposeDetail : purposeCode,
    note: clean(input.note, 5000),
    scheduledAt: futureDate(input.scheduledAt),
  };
}

async function assertLeadForActivity(auth, leadCode) {
  const row = await findLeadByCode({
    leadCode: required(leadCode, 'Lead Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllLeads(auth) || canViewAllActivities(auth),
  });
  if (!row) {
    const error = new Error('CRM Lead not found or not accessible.');
    error.statusCode = 404;
    error.code = 'CRM_LEAD_NOT_FOUND';
    throw error;
  }
  await assertBusinessUnitAccess(auth, row.business_unit_code);
  return row;
}

async function assertDealForActivity(auth, dealCode) {
  const row = await findDealByCode({
    dealCode: required(dealCode, 'Deal Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllDeals(auth) || canViewAllActivities(auth),
  });
  if (!row) {
    const error = new Error('CRM Deal not found or not accessible.');
    error.statusCode = 404;
    error.code = 'CRM_DEAL_NOT_FOUND';
    throw error;
  }
  await assertBusinessUnitAccess(auth, row.business_unit_code);
  return row;
}

export async function getCRMActivities({ auth, businessUnitCode = 'ALL', leadCode = null, dealCode = null, scope = 'AUTO' }) {
  const requestedScope = String(scope || 'AUTO').toUpperCase();
  const businessUnit = businessUnitCode !== 'ALL' ? await assertBusinessUnitAccess(auth, businessUnitCode) : null;
  const visibility = await resolveCRMDataVisibility({
    auth, businessUnit, requestedScope,
    globalViewAll: canViewAllActivities(auth),
    sharedCapability: 'activity.shared.view',
    teamCapability: 'activity.team.view',
  });
  if (leadCode) await assertLeadForActivity(auth, leadCode);
  if (dealCode) await assertDealForActivity(auth, dealCode);
  return (await listActivities({
    businessUnitCode,
    leadCode,
    dealCode,
    ownerUserId: actorUserId(auth),
    ownerUserIds: visibility.ownerUserIds,
    viewAllOwners: visibility.viewAllOwners,
  })).map((row) => serializeActivity(row, auth));
}

export async function createCRMActivity({ auth, leadCode, dealCode, input }) {
  if (Boolean(leadCode) === Boolean(dealCode)) {
    const error = new Error('Activity must belong to exactly one Lead or Deal.');
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_RELATED_RECORD_INVALID';
    throw error;
  }
  const payload = normalizeActivityPayload(input);
  const userId = actorUserId(auth);

  let businessUnitId;
  let leadId = null;
  let dealId = null;
  let ownerUserId = userId;

  if (leadCode) {
    const lead = await assertLeadForActivity(auth, leadCode);
    if (lead.status === 'CONVERTED') {
      const error = new Error('Schedule new work on the converted Deal instead of the Lead.');
      error.statusCode = 409;
      error.code = 'CRM_LEAD_CONVERTED_ACTIVITY_BLOCKED';
      throw error;
    }
    businessUnitId = lead.business_unit_id;
    leadId = lead.id;
    ownerUserId = userId || lead.owner_user_id;
  } else {
    const deal = await assertDealForActivity(auth, dealCode);
    if (['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) {
      const error = new Error('Closed Deal cannot receive a new Sales Activity.');
      error.statusCode = 409;
      error.code = 'CRM_DEAL_CLOSED_ACTIVITY_BLOCKED';
      throw error;
    }
    businessUnitId = deal.business_unit_id;
    dealId = deal.id;
    ownerUserId = userId || deal.owner_user_id;
  }

  const activityCode = await createActivityRecord({
    businessUnitId,
    leadId,
    dealId,
    ownerUserId,
    payload,
    actorUserId: userId,
  });
  const row = await findActivityByCode({ activityCode, ownerUserId: userId, viewAllOwners: true });
  return serializeActivity(row, auth);
}

async function getAccessibleActivity(auth, activityCode) {
  const row = await findActivityByCode({
    activityCode: required(activityCode, 'Activity Code', 32),
    ownerUserId: actorUserId(auth),
    viewAllOwners: canViewAllActivities(auth),
  });
  if (!row) {
    const error = new Error('CRM Activity not found or not accessible.');
    error.statusCode = 404;
    error.code = 'CRM_ACTIVITY_NOT_FOUND';
    throw error;
  }
  return row;
}

export async function completeCRMActivity({ auth, activityCode, input }) {
  const activity = await getAccessibleActivity(auth, activityCode);
  if (!['SCHEDULED', 'RESCHEDULED'].includes(activity.status)) {
    const error = new Error('Only an active Activity can be completed.');
    error.statusCode = 409;
    error.code = 'CRM_ACTIVITY_NOT_ACTIVE';
    throw error;
  }
  const outcome = required(input.outcome, 'Outcome', 80).toUpperCase();
  const allowed = OUTCOMES[activity.activity_type];
  if (!allowed?.has(outcome)) {
    const error = new Error('Outcome is invalid for this Activity Type.');
    error.statusCode = 400;
    error.code = 'CRM_ACTIVITY_OUTCOME_INVALID';
    throw error;
  }
  const resultNote = required(input.resultNote, 'Result / Discussion', 5000);
  const nextActivity = input.nextActivity ? normalizeActivityPayload(input.nextActivity) : null;
  let stageChange = null;
  if (input.dealStage) {
    if (!activity.deal_code) {
      const error = new Error('Deal Stage can only be updated from a Deal Activity.');
      error.statusCode = 400;
      error.code = 'CRM_ACTIVITY_DEAL_STAGE_REQUIRES_DEAL';
      throw error;
    }
    const deal = await getAccessibleDeal(auth, activity.deal_code);
    const toStage = required(input.dealStage, 'Deal Stage', 40).toUpperCase();
    if (toStage !== deal.stage) {
      const reason = validateDealStageChange(deal, toStage, { reason: input.stageReason, lostReason: input.lostReason });
      stageChange = { dealId: deal.id, dealCode: deal.deal_code, fromStage: deal.stage, toStage, reason };
    }
  }
  await completeActivityRecord({
    activity,
    outcome,
    resultNote,
    nextActivity,
    stageChange,
    actorUserId: actorUserId(auth),
  });
  const row = await findActivityByCode({ activityCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeActivity(row, auth);
}

export async function rescheduleCRMActivity({ auth, activityCode, input }) {
  const activity = await getAccessibleActivity(auth, activityCode);
  if (!['SCHEDULED', 'RESCHEDULED'].includes(activity.status)) {
    const error = new Error('Only an active Activity can be rescheduled.');
    error.statusCode = 409;
    error.code = 'CRM_ACTIVITY_NOT_ACTIVE';
    throw error;
  }
  const scheduledAt = futureDate(input.scheduledAt, 'New Schedule');
  const reason = required(input.reason, 'Reschedule Reason', 1000);
  await rescheduleActivityRecord({ activity, scheduledAt, reason, actorUserId: actorUserId(auth) });
  const row = await findActivityByCode({ activityCode, ownerUserId: actorUserId(auth), viewAllOwners: true });
  return serializeActivity(row, auth);
}


function normalizePeriod(value) {
  const raw = clean(value, 7) || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(raw)) {
    const error = new Error('Period must use YYYY-MM format.');
    error.statusCode = 400;
    error.code = 'CRM_PERIOD_INVALID';
    throw error;
  }
  const start = new Date(`${raw}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { raw, start: start.toISOString(), end: end.toISOString(), monthDate: `${raw}-01` };
}

export async function getCRMPerformance({ auth, businessUnitCode = 'ALL', period }) {
  const p = normalizePeriod(period);
  const actorId = actorUserId(auth);
  let bu = null;
  if (businessUnitCode !== 'ALL') bu = await assertBusinessUnitAccess(auth, businessUnitCode);

  const record = await getSalesPerformanceRecord({
    businessUnitCode,
    ownerUserId: actorId,
    periodStart: p.start,
    periodEnd: p.end,
  });

  let pointTarget = {
    swPoints: 0,
    revenue: 0,
    currency: 'LAK',
    source: 'NOT_APPLICABLE',
  };

  if (bu) {
    const [general, members, targets] = await Promise.all([
      getCRMBUSettingsRecord(bu.id),
      listCRMBUMembers(bu.id),
      listCRMSalesPointTargets(bu.id, p.monthDate),
    ]);
    const member = members.find((item) => String(item.user_id) === String(actorId));
    const teamIds = new Set((member?.team_ids || []).map((value) => String(value)));
    const direct = targets.find((item) => item.owner_user_id && String(item.owner_user_id) === String(actorId));
    const team = targets.find((item) => item.team_id && teamIds.has(String(item.team_id)));
    const buTarget = targets.find((item) => !item.owner_user_id && !item.team_id);
    const selected = direct || team || buTarget || null;
    pointTarget = {
      swPoints: Number(selected?.target_sw_points ?? general?.default_sw_point_target ?? 30),
      revenue: Number(selected?.target_revenue || 0),
      currency: selected?.currency || general?.currency || 'LAK',
      source: direct ? 'USER' : team ? 'TEAM' : buTarget ? 'BU' : 'BU_DEFAULT',
    };
  }

  const recognized = bu
    ? await getRecognizedPointSummary({ businessUnitCode: bu.code, ownerUserId: actorId, periodMonth: p.monthDate })
    : { sw_points: 0, hw_points: 0, amount_lak: 0, recognized_deals: 0 };
  const recognizedSWPoints = Number(recognized.sw_points || 0);
  const recognizedHWPoints = Number(recognized.hw_points || 0);
  const targetSWPoints = Number(pointTarget.swPoints || 0);

  const wonLicenses = Number(record.deals?.won_licenses || 0);
  const newLeads = Number(record.leads?.new_leads || 0);
  const convertedLeads = Number(record.leads?.converted_leads || 0);
  const wonDeals = Number(record.deals?.won_deals || 0);
  const dealsCreated = Number(record.deals?.deals_created || 0);

  return {
    period: p.raw,
    pointTarget,
    pointAchievement: {
      swPoints: recognizedSWPoints,
      hwPoints: recognizedHWPoints,
      rate: targetSWPoints > 0 ? Math.round((recognizedSWPoints / targetSWPoints) * 10000) / 100 : 0,
      remaining: Math.max(0, targetSWPoints - recognizedSWPoints),
      status: 'READY',
    },
    operational: {
      wonLicenses,
      wonDeals,
      wonValue: {
        LAK: Number(record.deals?.won_value_lak || 0),
        USD: Number(record.deals?.won_value_usd || 0),
        THB: Number(record.deals?.won_value_thb || 0),
      },
    },
    funnel: {
      newLeads,
      convertedLeads,
      dealsCreated,
      wonDeals,
      leadToDealRate: newLeads > 0 ? Math.round((convertedLeads / newLeads) * 10000) / 100 : 0,
      dealToWonRate: dealsCreated > 0 ? Math.round((wonDeals / dealsCreated) * 10000) / 100 : 0,
    },
    activity: {
      completed: Number(record.activities?.completed_activities || 0),
      overdue: Number(record.activities?.overdue_activities || 0),
    },
  };
}

function serializePersonalCommissionPlan(plan, requestedPeriod) {
  if (!plan) return null;
  return {
    id: String(plan.id),
    scopeType: plan.scope_type,
    teamId: plan.team_id ? String(plan.team_id) : undefined,
    teamName: plan.team_name || undefined,
    ownerUserId: plan.owner_user_id ? String(plan.owner_user_id) : undefined,
    ownerName: plan.owner_display_name || undefined,
    name: plan.name,
    modelType: plan.model_type,
    hardwareLAKPerPoint: Number(plan.hardware_lak_per_point || 0),
    status: plan.status,
    ruleSource: plan.rule_source || undefined,
    sourcePeriod: plan.period_month,
    isTemplate: String(plan.period_month).slice(0, 7) !== requestedPeriod,
    locked: Boolean(plan.locked_at),
    tiers: (plan.tiers || []).map((tier) => ({
      id: tier.id == null ? undefined : String(tier.id),
      tierCode: tier.tier_code,
      name: tier.name,
      minSWPoints: Number(tier.min_sw_points || 0),
      maxSWPoints: tier.max_sw_points == null ? null : Number(tier.max_sw_points),
      lakPerSWPoint: Number(tier.lak_per_sw_point || 0),
      position: Number(tier.position || 0),
    })),
  };
}

export async function getCRMCommissions({ auth, businessUnitCode = 'ALL', period }) {
  const p = normalizePeriod(period);
  const actorId = actorUserId(auth);
  let effectivePlan = null;
  let wonDeals = 0;
  let recognized = { sw_points: 0, hw_points: 0, amount_lak: 0, recognized_deals: 0 };

  if (businessUnitCode !== 'ALL') {
    const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
    const [members, plans, performance, pointSummary] = await Promise.all([
      listCRMBUMembers(bu.id),
      listCRMCommissionPlans(bu.id, p.monthDate, { fallbackToLatest: true }),
      getSalesPerformanceRecord({
        businessUnitCode,
        ownerUserId: actorId,
        periodStart: p.start,
        periodEnd: p.end,
      }),
      getRecognizedPointSummary({ businessUnitCode, ownerUserId: actorId, periodMonth: p.monthDate }),
    ]);
    recognized = pointSummary;
    wonDeals = Number(performance.deals?.won_deals || 0);
    const member = members.find((item) => String(item.user_id) === String(actorId));
    const teamIds = new Set((member?.team_ids || []).map((value) => String(value)));
    const direct = plans.find((item) => item.owner_user_id && String(item.owner_user_id) === String(actorId));
    const team = plans.find((item) => item.team_id && teamIds.has(String(item.team_id)));
    const buPlan = plans.find((item) => item.scope_type === 'BU');
    effectivePlan = serializePersonalCommissionPlan(direct || team || buPlan || null, p.raw);
  }

  return {
    period: p.raw,
    recognitionStatus: 'READY',
    recognized: {
      swPoints: Number(recognized.sw_points || 0),
      hwPoints: Number(recognized.hw_points || 0),
      amountLAK: Number(recognized.amount_lak || 0),
    },
    wonDeals,
    effectivePlan,
    message: 'Actual commission uses Closed Won Point Recognition snapshots. Software uses the final monthly SW tier for all SW Point; Hardware uses the configured fixed LAK per HW Point.',
  };
}


const CRM_TRUSTED_INTEGRATION_EVENTS = new Set([
  'QUOTATION_LINKED',
  'QUOTATION_CONFIRMED',
  'PAYMENT_SLIP_UPLOADED',
  'FINANCE_CONFIRMED_INVOICE',
]);

function monthForDateTimezone(value, timezone = 'Asia/Vientiane') {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    const error = new Error('Integration event occurredAt is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_INTEGRATION_DATE_INVALID';
    throw error;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit' }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    return `${year}-${month}-01`;
  } catch {
    return `${date.toISOString().slice(0, 7)}-01`;
  }
}

export async function processCRMIntegrationEvent({ auth, input }) {
  const sourceSystem = required(input.sourceSystem, 'Source System', 80).toUpperCase();
  const externalEventId = required(input.externalEventId, 'External Event ID', 160);
  const eventType = required(input.eventType, 'Event Type', 60).toUpperCase();
  if (!CRM_TRUSTED_INTEGRATION_EVENTS.has(eventType)) {
    const error = new Error('Unsupported CRM integration event type.');
    error.statusCode = 400;
    error.code = 'CRM_INTEGRATION_EVENT_INVALID';
    throw error;
  }
  const dealCode = required(input.dealCode, 'Deal Code', 40);
  const deal = await findDealByCode({ dealCode, ownerUserId: null, viewAllOwners: true });
  if (!deal) {
    const error = new Error('CRM Deal not found.');
    error.statusCode = 404;
    error.code = 'CRM_DEAL_NOT_FOUND';
    throw error;
  }
  const general = await getCRMBUSettingsRecord(deal.business_unit_id);
  const periodMonth = monthForDateTimezone(input.occurredAt, general?.timezone || 'Asia/Vientiane');
  const payload = {
    quotationNumber: clean(input.quotationNumber, 120),
    invoiceNumber: clean(input.invoiceNumber, 120),
    financeReference: clean(input.financeReference, 160),
    occurredAt: clean(input.occurredAt, 80),
  };
  const result = await processCRMIntegrationEventRecord({
    deal,
    sourceSystem,
    externalEventId,
    eventType,
    payload,
    periodMonth,
    actorUserId: actorUserId(auth),
  });
  const updated = await findDealByCode({ dealCode, ownerUserId: null, viewAllOwners: true });
  return { ...serializeDeal(updated, auth), integrationDuplicate: Boolean(result.duplicate) };
}

// --- v2.6.0.0 CRM BU Access + Settings ------------------------------------

const CRM_SETTING_GLOBAL_PERMISSION = {
  'settings.view': 'crm.bu.settings.view',
  'settings.manage': 'crm.bu.settings.manage',
  'members.manage': 'crm.members.manage',
  'teams.manage': 'crm.teams.manage',
  'pipeline.manage': 'crm.pipeline.settings.manage',
  'points.manage': 'crm.point.settings.manage',
  'product.manage': 'crm.product.master.manage',
  'customer.manage': 'crm.customer.master.manage',
  'targets.manage': 'crm.target.settings.manage',
  'commission.manage': 'crm.commission.settings.manage',
};

function authHasPermission(auth, code) {
  return Boolean(
    auth?.sessionKind === 'DEVELOPMENT_PREVIEW' ||
    auth?.isSuperAdmin ||
    auth?.permissions?.includes(code)
  );
}

async function crmAccessRows(auth) {
  return getCRMUserAccessRows(actorUserId(auth));
}

async function hasCRMCapability(auth, businessUnitCode, capability) {
  if (auth?.sessionKind === 'DEVELOPMENT_PREVIEW' || auth?.isSuperAdmin) return true;
  const mapped = CRM_SETTING_GLOBAL_PERMISSION[capability];
  if (mapped && authHasPermission(auth, mapped)) return true;

  const rows = await crmAccessRows(auth);
  const row = rows.find((item) => String(item.business_unit_code).toUpperCase() === String(businessUnitCode).toUpperCase());
  if (!row || row.status !== 'ACTIVE') return false;

  return (row.roles || []).some((role) => {
    const capabilities = Array.isArray(role.capabilities) ? role.capabilities : [];
    return capabilities.includes(capability) || capabilities.includes('settings.manage');
  });
}

const CRM_DATA_SCOPE_RANK = { SELF: 0, TEAM: 1, BU: 2, MULTI_BU: 3, ALL: 4 };

function roleHasCapability(role, capability) {
  const capabilities = Array.isArray(role?.capabilities) ? role.capabilities : [];
  return capabilities.includes(capability) || capabilities.includes('settings.manage');
}

async function resolveCRMDataVisibility({ auth, businessUnit, requestedScope, globalViewAll, sharedCapability, teamCapability }) {
  const actorId = actorUserId(auth);
  if (!actorId) return { viewAllOwners: false, ownerUserIds: [] };

  // Explicit SELF must stay personal even in DEVELOPMENT_PREVIEW so QA can accurately preview Sales.
  if (requestedScope === 'SELF' || !businessUnit) {
    return { viewAllOwners: false, ownerUserIds: null };
  }

  // QA / Development preview may inspect broader read scopes without changing stored membership or permissions.
  // Mutating endpoints still use the real authenticated access checks.
  if (auth?.sessionKind === 'DEVELOPMENT_PREVIEW') {
    if (requestedScope === 'TEAM') {
      const members = await listCRMBUMembers(businessUnit.id);
      const actorMember = members.find((member) => String(member.user_id) === String(actorId));
      const actorTeams = new Set((actorMember?.team_ids || []).map((value) => String(value)));
      if (!actorTeams.size) return { viewAllOwners: false, ownerUserIds: [String(actorId)] };
      const ownerUserIds = members
        .filter((member) => (member.team_ids || []).some((teamId) => actorTeams.has(String(teamId))))
        .map((member) => String(member.user_id));
      if (!ownerUserIds.includes(String(actorId))) ownerUserIds.push(String(actorId));
      return { viewAllOwners: false, ownerUserIds };
    }
    return { viewAllOwners: true, ownerUserIds: null };
  }

  if (globalViewAll || auth?.isSuperAdmin) {
    return { viewAllOwners: true, ownerUserIds: null };
  }

  const rows = await crmAccessRows(auth);
  const accessRow = rows.find((item) => String(item.business_unit_id) === String(businessUnit.id));
  const roles = Array.isArray(accessRow?.roles) ? accessRow.roles : [];

  const buRole = roles.find((role) => {
    const scope = String(role.dataScope ?? role.data_scope ?? 'SELF').toUpperCase();
    return CRM_DATA_SCOPE_RANK[scope] >= CRM_DATA_SCOPE_RANK.BU && roleHasCapability(role, sharedCapability);
  });
  if (buRole) return { viewAllOwners: true, ownerUserIds: null };

  const teamRole = roles.find((role) => {
    const scope = String(role.dataScope ?? role.data_scope ?? 'SELF').toUpperCase();
    return CRM_DATA_SCOPE_RANK[scope] >= CRM_DATA_SCOPE_RANK.TEAM && roleHasCapability(role, teamCapability);
  });
  if (teamRole) {
    const members = await listCRMBUMembers(businessUnit.id);
    const actorMember = members.find((member) => String(member.user_id) === String(actorId));
    const actorTeams = new Set((actorMember?.team_ids || []).map((value) => String(value)));
    if (!actorTeams.size) return { viewAllOwners: false, ownerUserIds: [String(actorId)] };
    const ownerUserIds = members
      .filter((member) => (member.team_ids || []).some((teamId) => actorTeams.has(String(teamId))))
      .map((member) => String(member.user_id));
    if (!ownerUserIds.includes(String(actorId))) ownerUserIds.push(String(actorId));
    return { viewAllOwners: false, ownerUserIds };
  }

  return { viewAllOwners: false, ownerUserIds: null };
}

async function requireCRMCapability(auth, businessUnitCode, capability) {
  if (await hasCRMCapability(auth, businessUnitCode, capability)) return;
  const error = new Error(`CRM permission required: ${capability}`);
  error.statusCode = 403;
  error.code = 'CRM_TOOL_PERMISSION_REQUIRED';
  throw error;
}

function currentMonthForTimezone(timezone = 'Asia/Vientiane') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    if (year && month) return `${year}-${month}`;
  } catch {}
  return new Date().toISOString().slice(0, 7);
}

function assertEditablePeriod(value, timezone = 'Asia/Vientiane') {
  const p = normalizePeriod(value);
  const current = currentMonthForTimezone(timezone);
  if (p.raw < current) {
    const error = new Error('Past CRM setting periods are locked by Running Date.');
    error.statusCode = 409;
    error.code = 'CRM_SETTING_PERIOD_LOCKED';
    throw error;
  }
  return p;
}

function wholeNumber(value, label, { min = 0, max = 1000000 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    const error = new Error(`${label} must be a whole number between ${min} and ${max}.`);
    error.statusCode = 400;
    error.code = 'CRM_INTEGER_SETTING_INVALID';
    throw error;
  }
  return number;
}

function nonNegativeNumber(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${label} must be zero or greater.`);
    error.statusCode = 400;
    error.code = 'CRM_NUMBER_SETTING_INVALID';
    throw error;
  }
  return number;
}

function dateOnly(value, label, optional = false) {
  const raw = clean(value, 10);
  if (!raw && optional) return null;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const error = new Error(`${label} must use YYYY-MM-DD format.`);
    error.statusCode = 400;
    error.code = 'CRM_DATE_SETTING_INVALID';
    throw error;
  }
  return raw;
}

function serializeCRMRole(row) {
  return {
    code: row.code,
    name: row.name,
    description: row.description || undefined,
    accessLevel: Number(row.access_level || 0),
    dataScope: row.data_scope,
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    isSystem: Boolean(row.is_system),
  };
}

function serializeCRMAccessRow(row) {
  return {
    membershipId: String(row.membership_id),
    businessUnitId: String(row.business_unit_id),
    businessUnit: row.business_unit_code,
    businessUnitName: row.business_unit_name,
    status: row.status,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to || undefined,
    roles: (row.roles || []).map((role) => ({
      code: role.code,
      name: role.name,
      accessLevel: Number(role.accessLevel ?? role.access_level ?? 0),
      dataScope: role.dataScope ?? role.data_scope,
      capabilities: Array.isArray(role.capabilities) ? role.capabilities : [],
    })),
  };
}

export async function getCRMAccessProfile(auth) {
  const rows = await crmAccessRows(auth);
  const memberships = rows.map(serializeCRMAccessRow);
  const globalSettings = auth?.sessionKind === 'DEVELOPMENT_PREVIEW' ||
    auth?.isSuperAdmin ||
    authHasPermission(auth, 'crm.bu.settings.view') ||
    authHasPermission(auth, 'crm.bu.settings.manage');

  const canViewSettings = globalSettings || memberships.some((membership) =>
    membership.roles.some((role) =>
      role.capabilities.includes('settings.view') || role.capabilities.includes('settings.manage')
    )
  );

  return {
    userId: actorUserId(auth) ? String(actorUserId(auth)) : undefined,
    isSuperAdmin: Boolean(auth?.isSuperAdmin || auth?.sessionKind === 'DEVELOPMENT_PREVIEW'),
    memberships,
    canViewSettings,
  };
}

export async function getCRMBUSettings({ auth, businessUnitCode, period }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'settings.view');
  const p = normalizePeriod(period);
  const [general, members, teams, roles, users, pipeline, pointRules, targets, commissionPlans, productOptions, customerMaster] = await Promise.all([
    getCRMBUSettingsRecord(bu.id),
    listCRMBUMembers(bu.id),
    listCRMSalesTeams(bu.id),
    listCRMRoleDefinitions(),
    listCRMSettingsUsers(),
    listCRMPipelineSettings(bu.id),
    listCRMPointRules(bu.id, p.monthDate, { fallbackToLatest: true }),
    listCRMSalesPointTargets(bu.id, p.monthDate),
    listCRMCommissionPlans(bu.id, p.monthDate, { fallbackToLatest: true }),
    crmProductOptionsForBusinessUnit(bu),
    listCustomerMasterByBusinessUnit(bu.id),
  ]);
  const runningMonth = currentMonthForTimezone(general?.timezone || 'Asia/Vientiane');

  return {
    businessUnit: serializeBusinessUnit(bu),
    period: p.raw,
    periodLocked: p.raw < runningMonth,
    general: {
      status: general?.status || 'ACTIVE',
      currency: general?.currency || 'LAK',
      timezone: general?.timezone || 'Asia/Vientiane',
      defaultSWPointTarget: Number(general?.default_sw_point_target ?? 30),
    },
    users: users.map((row) => ({
      id: String(row.id),
      email: row.email,
      employeeCode: row.employee_code || undefined,
      name: row.display_name || row.email,
    })),
    roles: roles.map(serializeCRMRole),
    members: members.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      name: row.display_name || row.email,
      email: row.email,
      employeeCode: row.employee_code || undefined,
      status: row.status,
      effectiveFrom: row.effective_from,
      effectiveTo: row.effective_to || undefined,
      roleCodes: row.role_codes || [],
      teamIds: row.team_ids || [],
    })),
    teams: teams.map((row) => ({
      id: String(row.id),
      teamCode: row.team_code,
      name: row.name,
      managerUserId: row.manager_user_id ? String(row.manager_user_id) : undefined,
      managerName: row.manager_display_name || undefined,
      status: row.status,
      memberCount: Number(row.member_count || 0),
    })),
    pipelineStages: pipeline.map((row) => ({
      stageCode: row.stage_code,
      label: row.label,
      position: Number(row.position),
      isEnabled: Boolean(row.is_enabled),
      isSystemControlled: Boolean(row.is_system_controlled),
    })),
    productOptions,
    customerMaster: customerMaster.map(serializeCustomerMaster),
    pointRules: pointRules.map((row) => ({
      id: String(row.id),
      productCode: row.product_code,
      productName: row.product_name,
      pointType: row.point_type,
      unitLabel: row.unit_label || undefined,
      pointsPerUnit: Number(row.points_per_unit || 0),
      locked: Boolean(row.locked_at) || p.raw < runningMonth,
    })),
    targets: targets.map((row) => ({
      id: String(row.id),
      teamId: row.team_id ? String(row.team_id) : undefined,
      teamName: row.team_name || undefined,
      ownerUserId: row.owner_user_id ? String(row.owner_user_id) : undefined,
      ownerName: row.owner_display_name || undefined,
      targetSWPoints: Number(row.target_sw_points || 0),
      targetRevenue: Number(row.target_revenue || 0),
      currency: row.currency,
      locked: Boolean(row.locked_at) || p.raw < runningMonth,
    })),
    commissionPlans: commissionPlans.map((plan) => ({
      id: String(plan.id),
      scopeType: plan.scope_type,
      teamId: plan.team_id ? String(plan.team_id) : undefined,
      teamName: plan.team_name || undefined,
      ownerUserId: plan.owner_user_id ? String(plan.owner_user_id) : undefined,
      ownerName: plan.owner_display_name || undefined,
      name: plan.name,
      modelType: plan.model_type,
      hardwareLAKPerPoint: Number(plan.hardware_lak_per_point || 0),
      status: plan.status,
      ruleSource: plan.rule_source || undefined,
      sourcePeriod: plan.period_month,
      isTemplate: String(plan.period_month).slice(0, 7) !== p.raw,
      locked: Boolean(plan.locked_at) || p.raw < runningMonth,
      tiers: (plan.tiers || []).map((tier) => ({
        id: tier.id == null ? undefined : String(tier.id),
        tierCode: tier.tier_code,
        name: tier.name,
        minSWPoints: Number(tier.min_sw_points || 0),
        maxSWPoints: tier.max_sw_points == null ? null : Number(tier.max_sw_points),
        lakPerSWPoint: Number(tier.lak_per_sw_point || 0),
        position: Number(tier.position || 0),
      })),
    })),
  };
}

export async function saveCRMBUGeneral({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'settings.manage');
  const currency = required(input.currency, 'Currency', 3).toUpperCase();
  if (!CURRENCIES.has(currency)) {
    const error = new Error('CRM BU Currency is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_BU_CURRENCY_INVALID';
    throw error;
  }
  const timezone = required(input.timezone, 'Timezone', 80);
  const defaultSWPointTarget = wholeNumber(input.defaultSWPointTarget ?? 30, 'Default SW Point Target');
  await saveCRMBUGeneralRecord({
    businessUnitId: bu.id, currency, timezone, defaultSWPointTarget, actorUserId: actorUserId(auth),
  });
  return { success: true };
}

export async function saveCRMBUMember({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'members.manage');
  const userId = wholeNumber(input.userId, 'User ID', { min: 1, max: Number.MAX_SAFE_INTEGER });
  const status = required(input.status || 'ACTIVE', 'Status', 20).toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('CRM Membership Status is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_MEMBERSHIP_STATUS_INVALID';
    throw error;
  }
  const effectiveFrom = dateOnly(input.effectiveFrom || new Date().toISOString().slice(0, 10), 'Effective From');
  const effectiveTo = dateOnly(input.effectiveTo, 'Effective To', true);
  if (effectiveTo && effectiveTo < effectiveFrom) {
    const error = new Error('Effective To cannot be earlier than Effective From.');
    error.statusCode = 400;
    error.code = 'CRM_MEMBERSHIP_DATE_RANGE_INVALID';
    throw error;
  }
  const availableRoles = new Set((await listCRMRoleDefinitions()).map((role) => role.code));
  const roleCodes = [...new Set((Array.isArray(input.roleCodes) ? input.roleCodes : []).map((value) => String(value).toUpperCase()))];
  if (!roleCodes.length || roleCodes.some((code) => !availableRoles.has(code))) {
    const error = new Error('Select at least one valid CRM Role.');
    error.statusCode = 400;
    error.code = 'CRM_MEMBERSHIP_ROLE_INVALID';
    throw error;
  }
  const teamIds = [...new Set((Array.isArray(input.teamIds) ? input.teamIds : []).map((value) => String(value)).filter(Boolean))];
  await saveCRMBUMemberRecord({
    businessUnitId: bu.id, userId, status, effectiveFrom, effectiveTo, roleCodes, teamIds, actorUserId: actorUserId(auth),
  });
  return { success: true };
}

export async function saveCRMSalesTeam({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'teams.manage');
  const status = required(input.status || 'ACTIVE', 'Status', 20).toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('CRM Team Status is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_TEAM_STATUS_INVALID';
    throw error;
  }
  const teamCode = required(input.teamCode, 'Team Code', 60).toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
  const teamId = clean(input.teamId, 30);
  const managerUserId = input.managerUserId ? wholeNumber(input.managerUserId, 'Manager User ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  const id = await saveCRMSalesTeamRecord({
    businessUnitId: bu.id, teamId, teamCode, name: required(input.name, 'Team Name', 160),
    managerUserId, status, actorUserId: actorUserId(auth),
  });
  return { id: id ? String(id) : null };
}

export async function saveCRMPipelineSettings({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'pipeline.manage');
  const rawStages = Array.isArray(input.stages) ? input.stages : [];
  if (!rawStages.length) {
    const error = new Error('Pipeline requires at least one stage.');
    error.statusCode = 400;
    error.code = 'CRM_PIPELINE_STAGE_REQUIRED';
    throw error;
  }
  const stages = rawStages.map((stage, index) => {
    const stageCode = required(stage.stageCode, 'Stage Code', 40).toUpperCase();
    if (!DEAL_STAGES.has(stageCode)) {
      const error = new Error(`Unsupported Deal Stage: ${stageCode}`);
      error.statusCode = 400;
      error.code = 'CRM_PIPELINE_STAGE_INVALID';
      throw error;
    }
    return {
      stageCode,
      label: required(stage.label, 'Stage Label', 120),
      position: wholeNumber(stage.position ?? index + 1, 'Stage Position', { min: 1, max: 100 }),
      isEnabled: stage.isEnabled !== false,
      isSystemControlled: stageCode === 'CLOSED_WON' ? true : Boolean(stage.isSystemControlled),
    };
  });
  await saveCRMPipelineSettingsRecords({ businessUnitId: bu.id, stages, actorUserId: actorUserId(auth) });
  return { success: true };
}

export async function saveCRMProductMaster({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  const canManage = await hasCRMCapability(auth, bu.code, 'product.manage') || await hasCRMCapability(auth, bu.code, 'points.manage');
  if (!canManage) {
    const error = new Error('Product Master manage access is required.');
    error.statusCode = 403;
    error.code = 'CRM_PRODUCT_MASTER_FORBIDDEN';
    throw error;
  }

  const productId = input.productId ? wholeNumber(input.productId, 'Product ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  const productType = required(input.productType, 'Product Type', 20).toUpperCase();
  if (!['SOFTWARE', 'HARDWARE'].includes(productType)) {
    const error = new Error('Product Type must be SOFTWARE or HARDWARE.');
    error.statusCode = 400;
    error.code = 'PRODUCT_MASTER_TYPE_INVALID';
    throw error;
  }
  const currency = required(input.currency || 'LAK', 'Currency', 3).toUpperCase();
  if (!CURRENCIES.has(currency)) {
    const error = new Error('Product currency is invalid.');
    error.statusCode = 400;
    error.code = 'PRODUCT_MASTER_CURRENCY_INVALID';
    throw error;
  }
  const status = required(input.status || 'ACTIVE', 'Status', 20).toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Product status is invalid.');
    error.statusCode = 400;
    error.code = 'PRODUCT_MASTER_STATUS_INVALID';
    throw error;
  }

  const row = await saveProductMasterRecord({
    businessUnitId: bu.id,
    productId,
    productName: required(input.productName, 'Product Name', 200),
    productType,
    category: clean(input.category, 100) || null,
    unitLabel: clean(input.unitLabel, 80) || null,
    inventoryManaged: productType === 'HARDWARE' ? Boolean(input.inventoryManaged) : false,
    defaultUnitPrice: nonNegativeNumber(input.defaultUnitPrice ?? 0, 'Default Unit Price'),
    currency,
    status,
    description: clean(input.description, 1000) || null,
    actorUserId: actorUserId(auth),
  });
  if (!row) {
    const error = new Error('Product Master record not found.');
    error.statusCode = 404;
    error.code = 'PRODUCT_MASTER_NOT_FOUND';
    throw error;
  }
  return {
    id: String(row.id),
    productCode: row.product_code,
    productName: row.product_name,
    pointType: row.product_type,
    category: row.category || undefined,
    unitLabel: row.unit_label || undefined,
    inventoryManaged: Boolean(row.inventory_managed),
    defaultUnitPrice: Number(row.default_unit_price || 0),
    currency: row.currency || 'LAK',
    description: row.description || undefined,
    source: 'PRODUCT_MASTER',
    status: row.business_unit_status || 'ACTIVE',
  };
}


export async function saveCRMCustomerMaster({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  const canManage = await hasCRMCapability(auth, bu.code, 'customer.manage');
  if (!canManage) {
    const error = new Error('Customer Master manage access is required.');
    error.statusCode = 403;
    error.code = 'CRM_CUSTOMER_MASTER_FORBIDDEN';
    throw error;
  }

  const customerId = input.customerId ? wholeNumber(input.customerId, 'Customer ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  const customerType = required(input.customerType || 'BUSINESS', 'Customer Type', 20).toUpperCase();
  if (!['BUSINESS', 'INDIVIDUAL'].includes(customerType)) {
    const error = new Error('Customer Type must be BUSINESS or INDIVIDUAL.');
    error.statusCode = 400;
    error.code = 'CUSTOMER_MASTER_TYPE_INVALID';
    throw error;
  }
  const status = required(input.status || 'ACTIVE', 'Status', 20).toUpperCase();
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const error = new Error('Customer status is invalid.');
    error.statusCode = 400;
    error.code = 'CUSTOMER_MASTER_STATUS_INVALID';
    throw error;
  }

  const row = await saveCustomerMasterRecord({
    businessUnitId: bu.id,
    customerId,
    displayName: required(input.displayName, 'Customer / Store Name', 220),
    legalCompanyName: clean(input.legalCompanyName, 220) || null,
    customerType,
    primaryContact: clean(input.primaryContact, 180) || null,
    phone: clean(input.phone, 80) || null,
    email: clean(input.email, 220) || null,
    whatsapp: clean(input.whatsapp, 120) || null,
    province: clean(input.province, 160) || null,
    status,
    note: clean(input.note, 5000) || null,
    actorUserId: actorUserId(auth),
  });
  if (!row) {
    const error = new Error('Customer Master record not found.');
    error.statusCode = 404;
    error.code = 'CUSTOMER_MASTER_NOT_FOUND';
    throw error;
  }
  return serializeCustomerMaster(row);
}

export async function saveCRMPointRules({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'points.manage');
  const general = await getCRMBUSettingsRecord(bu.id);
  const p = assertEditablePeriod(input.period, general?.timezone || 'Asia/Vientiane');
  const rawRules = Array.isArray(input.rules) ? input.rules : [];
  const controlledProducts = await crmProductOptionsForBusinessUnit(bu);
  const productByCode = new Map(controlledProducts.filter((product) => product.status === 'ACTIVE').map((product) => [product.productCode, product]));
  const seenProductCodes = new Set();
  const rules = rawRules.map((rule) => {
    const productCode = required(rule.productCode, 'Product Code', 60).toUpperCase();
    const product = productByCode.get(productCode);
    if (!product) {
      const error = new Error(`Product ${productCode} is not available in the controlled Product Selector.`);
      error.statusCode = 400;
      error.code = 'CRM_POINT_PRODUCT_INVALID';
      throw error;
    }
    if (seenProductCodes.has(productCode)) {
      const error = new Error(`Product ${product.productName} is duplicated in Point Settings.`);
      error.statusCode = 400;
      error.code = 'CRM_POINT_PRODUCT_DUPLICATE';
      throw error;
    }
    seenProductCodes.add(productCode);
    return {
      productCode,
      productName: product.productName,
      pointType: product.pointType,
      unitLabel: product.unitLabel || null,
      pointsPerUnit: wholeNumber(rule.pointsPerUnit, 'Point', { min: 0, max: 100000 }),
    };
  });
  await saveCRMPointRulesRecords({ businessUnitId: bu.id, periodMonth: p.monthDate, rules, actorUserId: actorUserId(auth) });
  return { success: true };
}

export async function saveCRMSalesPointTarget({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'targets.manage');
  const general = await getCRMBUSettingsRecord(bu.id);
  const p = assertEditablePeriod(input.period, general?.timezone || 'Asia/Vientiane');
  const teamId = input.teamId ? wholeNumber(input.teamId, 'Team ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  const ownerUserId = input.ownerUserId ? wholeNumber(input.ownerUserId, 'Owner User ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  if (teamId && ownerUserId) {
    const error = new Error('Target can be scoped to either Team or Sales Owner, not both.');
    error.statusCode = 400;
    error.code = 'CRM_TARGET_SCOPE_INVALID';
    throw error;
  }
  const currency = (clean(input.currency, 3) || 'LAK').toUpperCase();
  if (!CURRENCIES.has(currency)) {
    const error = new Error('Target Currency is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_TARGET_CURRENCY_INVALID';
    throw error;
  }
  const id = await saveCRMSalesPointTargetRecord({
    businessUnitId: bu.id, periodMonth: p.monthDate, teamId, ownerUserId,
    targetSWPoints: wholeNumber(input.targetSWPoints ?? 30, 'SW Point Target'),
    targetRevenue: nonNegativeNumber(input.targetRevenue ?? 0, 'Revenue Target'),
    currency, actorUserId: actorUserId(auth),
  });
  return { id: String(id) };
}

export async function saveCRMCommissionPlan({ auth, businessUnitCode, input }) {
  const bu = await assertBusinessUnitAccess(auth, businessUnitCode);
  await requireCRMCapability(auth, bu.code, 'commission.manage');
  const general = await getCRMBUSettingsRecord(bu.id);
  const p = assertEditablePeriod(input.period, general?.timezone || 'Asia/Vientiane');
  const scopeType = required(input.scopeType || 'BU', 'Commission Scope', 20).toUpperCase();
  if (!['BU', 'TEAM', 'USER'].includes(scopeType)) {
    const error = new Error('Commission Scope must be BU, TEAM, or USER.');
    error.statusCode = 400;
    error.code = 'CRM_COMMISSION_SCOPE_INVALID';
    throw error;
  }
  const teamId = scopeType === 'TEAM' ? wholeNumber(input.teamId, 'Team ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  const ownerUserId = scopeType === 'USER' ? wholeNumber(input.ownerUserId, 'Owner User ID', { min: 1, max: Number.MAX_SAFE_INTEGER }) : null;
  if (scopeType === 'TEAM') {
    const teams = await listCRMSalesTeams(bu.id);
    if (!teams.some((team) => String(team.id) === String(teamId))) {
      const error = new Error('Commission Team does not belong to this CRM Business Unit.');
      error.statusCode = 400;
      error.code = 'CRM_COMMISSION_TEAM_INVALID';
      throw error;
    }
  }
  if (scopeType === 'USER') {
    const members = await listCRMBUMembers(bu.id);
    if (!members.some((member) => String(member.user_id) === String(ownerUserId) && member.status === 'ACTIVE')) {
      const error = new Error('Commission Owner must be an active CRM member of this Business Unit.');
      error.statusCode = 400;
      error.code = 'CRM_COMMISSION_OWNER_INVALID';
      throw error;
    }
  }
  const status = required(input.status || 'OPEN', 'Commission Status', 20).toUpperCase();
  if (!['OPEN', 'LOCKED', 'INACTIVE'].includes(status)) {
    const error = new Error('Commission Plan Status is invalid.');
    error.statusCode = 400;
    error.code = 'CRM_COMMISSION_STATUS_INVALID';
    throw error;
  }
  const rawTiers = Array.isArray(input.tiers) ? input.tiers : [];
  if (!rawTiers.length) {
    const error = new Error('Commission Plan requires at least one Software tier.');
    error.statusCode = 400;
    error.code = 'CRM_COMMISSION_TIER_REQUIRED';
    throw error;
  }
  const tiers = rawTiers.map((tier, index) => ({
    tierCode: required(tier.tierCode || `TIER_${index}`, 'Tier Code', 40).toUpperCase(),
    name: required(tier.name || `Tier ${index}`, 'Tier Name', 100),
    minSWPoints: wholeNumber(tier.minSWPoints, 'Min SW Point'),
    maxSWPoints: tier.maxSWPoints === null || tier.maxSWPoints === '' || tier.maxSWPoints === undefined
      ? null
      : wholeNumber(tier.maxSWPoints, 'Max SW Point'),
    lakPerSWPoint: nonNegativeNumber(tier.lakPerSWPoint, 'LAK / SW Point'),
    position: wholeNumber(tier.position ?? index + 1, 'Tier Position', { min: 1, max: 100 }),
  })).sort((a, b) => a.position - b.position);

  for (const tier of tiers) {
    if (tier.maxSWPoints != null && tier.maxSWPoints < tier.minSWPoints) {
      const error = new Error(`${tier.name}: Max SW Point cannot be below Min SW Point.`);
      error.statusCode = 400;
      error.code = 'CRM_COMMISSION_TIER_RANGE_INVALID';
      throw error;
    }
  }

  const id = await saveCRMCommissionPlanRecord({
    businessUnitId: bu.id, periodMonth: p.monthDate, scopeType, teamId, ownerUserId,
    name: required(input.name || 'Standard Commission', 'Plan Name', 180),
    hardwareLAKPerPoint: nonNegativeNumber(input.hardwareLAKPerPoint, 'Hardware LAK / Point'),
    status, ruleSource: clean(input.ruleSource, 120), tiers, actorUserId: actorUserId(auth),
  });
  return { id: String(id) };
}

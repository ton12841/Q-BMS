
import {
  listBusinessUnits,
  getBusinessUnitById,
  insertBusinessUnit,
  updateBusinessUnitRecord,
  getBusinessUnitUsage,
  deleteBusinessUnitRecord,
  insertOrganizationAuditLog,
  listJobLevels,
  listJobGrades,
  listJobFamilies,
  listPositions,
  getJobFamilyById,
  insertJobFamily,
  updateJobFamilyRecord,
  getPositionById,
  validatePositionReferences,
  insertPosition,
  updatePositionRecord,
} from './organization.repository.js';

export async function getOrganizationMaster({ locale = 'en' } = {}) {
  const [
    businessUnits,
    jobLevels,
    jobGrades,
    jobFamilies,
    positions,
  ] = await Promise.all([
    listBusinessUnits({ locale }),
    listJobLevels({ locale }),
    listJobGrades({ locale }),
    listJobFamilies({ locale }),
    listPositions({ locale }),
  ]);

  return {
    businessUnits,
    jobLevels,
    jobGrades,
    jobFamilies,
    positions,
  };
}

export async function getBusinessUnits({ locale = 'en' } = {}) {
  return listBusinessUnits({ locale });
}

function normalizeBusinessUnitPayload(payload = {}) {
  const code = String(payload.code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  const name = String(payload.name || '').trim();
  const description = String(payload.description || '').trim() || null;
  const status = String(payload.status || 'ACTIVE').trim().toUpperCase();
  const sortOrder = Number(payload.sort_order ?? payload.sortOrder ?? 0);

  if (!code) throw validationError('Business Unit code is required.');
  if (!name) throw validationError('Business Unit name is required.');
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw validationError('Business Unit code may contain only A-Z, 0-9, underscore and hyphen.');
  }
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw validationError('Invalid Business Unit status.');
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw validationError('Sort order must be zero or a positive integer.');
  }

  return {code, name, description, status, sortOrder};
}

export async function createBusinessUnit(payload, actorUserId = null) {
  const data = normalizeBusinessUnitPayload(payload);
  const created = await insertBusinessUnit(data);

  await insertOrganizationAuditLog({
    actorUserId,
    action: 'ORGANIZATION_BUSINESS_UNIT_CREATED',
    entityType: 'BUSINESS_UNIT',
    entityId: created.id,
    metadata: {
      code: created.code,
      name: created.name,
      status: created.status,
    },
  });

  return created;
}

export async function updateBusinessUnit({id, payload, actorUserId = null}) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw validationError('Invalid Business Unit ID.');
  }

  const current = await getBusinessUnitById(Number(id));
  if (!current) return null;

  const data = normalizeBusinessUnitPayload(payload);
  const updated = await updateBusinessUnitRecord({
    id: Number(id),
    ...data,
  });

  await insertOrganizationAuditLog({
    actorUserId,
    action: 'ORGANIZATION_BUSINESS_UNIT_UPDATED',
    entityType: 'BUSINESS_UNIT',
    entityId: updated.id,
    metadata: {
      before: {
        code: current.code,
        name: current.name,
        status: current.status,
        sort_order: current.sort_order,
      },
      after: {
        code: updated.code,
        name: updated.name,
        status: updated.status,
        sort_order: updated.sort_order,
      },
    },
  });

  return updated;
}

export async function removeBusinessUnit({id, actorUserId = null}) {
  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    throw validationError('Invalid Business Unit ID.');
  }

  const current = await getBusinessUnitById(Number(id));
  if (!current) return null;

  const usage = await getBusinessUnitUsage(Number(id));
  const totalUsage =
    Number(usage.employee_primary_count || 0) +
    Number(usage.employee_business_unit_count || 0) +
    Number(usage.assignment_count || 0);

  if (totalUsage > 0) {
    const error = new Error(
      'Business Unit is already used by Employee or Assignment data. Set status to INACTIVE instead of deleting it.'
    );
    error.statusCode = 409;
    error.details = usage;
    throw error;
  }

  const deleted = await deleteBusinessUnitRecord(Number(id));
  if (!deleted) return null;

  await insertOrganizationAuditLog({
    actorUserId,
    action: 'ORGANIZATION_BUSINESS_UNIT_DELETED',
    entityType: 'BUSINESS_UNIT',
    entityId: id,
    metadata: {
      code: current.code,
      name: current.name,
    },
  });

  return {deleted: true, id: String(id)};
}


export async function getJobLevels({ locale = 'en' } = {}) {
  return listJobLevels({ locale });
}

export async function getJobGrades({ locale = 'en' } = {}) {
  return listJobGrades({ locale });
}

export async function getLevelGradeStructure({ locale = 'en' } = {}) {
  const [levels, grades] = await Promise.all([
    listJobLevels({ locale }),
    listJobGrades({ locale }),
  ]);

  return levels.map((level) => ({
    ...level,
    grades: grades.filter(
      (grade) => String(grade.job_level_id) === String(level.id)
    ),
  }));
}

export async function getJobFamilies({ locale = 'en' } = {}) {
  return listJobFamilies({ locale });
}

export async function getPositions({
  locale = 'en',
  jobFamilyId = null,
  jobGradeId = null,
} = {}) {
  return listPositions({ locale, jobFamilyId, jobGradeId });
}


export async function getJobFamily({
  id,
  locale = 'en',
}) {
  return getJobFamilyById({ id, locale });
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeJobFamilyPayload(payload = {}) {
  const code = String(payload.code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');

  const status = String(payload.status || 'ACTIVE')
    .trim()
    .toUpperCase();

  const sortOrder = Number.isFinite(Number(payload.sort_order))
    ? Number(payload.sort_order)
    : 0;

  const rawTranslations = payload.translations || {};

  const translations = {
    en: {
      name: String(
        rawTranslations.en?.name || payload.name || ''
      ).trim(),
      description: String(
        rawTranslations.en?.description ||
        payload.description ||
        ''
      ).trim(),
    },
    th: {
      name: String(rawTranslations.th?.name || '').trim(),
      description: String(
        rawTranslations.th?.description || ''
      ).trim(),
    },
    lo: {
      name: String(rawTranslations.lo?.name || '').trim(),
      description: String(
        rawTranslations.lo?.description || ''
      ).trim(),
    },
  };

  if (!code) {
    throw validationError('Job Family code is required.');
  }

  if (!translations.en.name) {
    throw validationError(
      'English Job Family name is required.'
    );
  }

  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw validationError('Invalid Job Family status.');
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw validationError(
      'Sort order must be zero or a positive integer.'
    );
  }

  return {
    code,
    name: translations.en.name,
    description:
      translations.en.description || null,
    status,
    sortOrder,
    translations,
  };
}

export async function createJobFamily(payload) {
  const data = normalizeJobFamilyPayload(payload);
  return insertJobFamily(data);
}

export async function updateJobFamily({
  id,
  payload,
}) {
  if (
    !Number.isInteger(Number(id)) ||
    Number(id) <= 0
  ) {
    throw validationError('Invalid Job Family ID.');
  }

  const data = normalizeJobFamilyPayload(payload);

  return updateJobFamilyRecord({
    id: Number(id),
    ...data,
  });
}


export async function getPosition({
  id,
  locale = 'en',
}) {
  return getPositionById({ id, locale });
}

function normalizePositionPayload(payload = {}) {
  const code = String(payload.code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');

  const jobFamilyId = Number(
    payload.job_family_id
  );

  const jobGradeIds = [
    ...new Set(
      (Array.isArray(payload.job_grade_ids)
        ? payload.job_grade_ids
        : []
      )
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value > 0
        )
    ),
  ];

  const status = String(
    payload.status || 'ACTIVE'
  )
    .trim()
    .toUpperCase();

  const sortOrder = Number.isFinite(
    Number(payload.sort_order)
  )
    ? Number(payload.sort_order)
    : 0;

  const rawTranslations =
    payload.translations || {};

  const translations = {
    en: {
      name: String(
        rawTranslations.en?.name ||
        payload.name ||
        ''
      ).trim(),
      description: String(
        rawTranslations.en?.description ||
        payload.description ||
        ''
      ).trim(),
    },
    th: {
      name: String(
        rawTranslations.th?.name || ''
      ).trim(),
      description: String(
        rawTranslations.th?.description || ''
      ).trim(),
    },
    lo: {
      name: String(
        rawTranslations.lo?.name || ''
      ).trim(),
      description: String(
        rawTranslations.lo?.description || ''
      ).trim(),
    },
  };

  if (!code) {
    throw validationError(
      'Position code is required.'
    );
  }

  if (!translations.en.name) {
    throw validationError(
      'English Position name is required.'
    );
  }

  if (
    !Number.isInteger(jobFamilyId) ||
    jobFamilyId <= 0
  ) {
    throw validationError(
      'Job Family is required.'
    );
  }

  if (!jobGradeIds.length) {
    throw validationError(
      'Select at least one allowed Job Grade.'
    );
  }

  if (
    !['ACTIVE', 'INACTIVE'].includes(status)
  ) {
    throw validationError(
      'Invalid Position status.'
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw validationError(
      'Sort order must be zero or a positive integer.'
    );
  }

  return {
    code,
    name: translations.en.name,
    description:
      translations.en.description || null,
    jobFamilyId,
    jobGradeIds,
    status,
    sortOrder,
    translations,
  };
}

async function assertPositionReferences({
  jobFamilyId,
  jobGradeIds,
}) {
  const references =
    await validatePositionReferences({
      jobFamilyId,
      jobGradeIds,
    });

  if (!references.job_family_exists) {
    throw validationError(
      'Selected Job Family is not available.'
    );
  }

  if (
    Number(references.active_grade_count) !==
    jobGradeIds.length
  ) {
    throw validationError(
      'One or more selected Job Grades are not available.'
    );
  }
}

export async function createPosition(payload) {
  const data =
    normalizePositionPayload(payload);

  await assertPositionReferences(data);

  return insertPosition(data);
}

export async function updatePosition({
  id,
  payload,
}) {
  if (
    !Number.isInteger(Number(id)) ||
    Number(id) <= 0
  ) {
    throw validationError(
      'Invalid Position ID.'
    );
  }

  const data =
    normalizePositionPayload(payload);

  await assertPositionReferences(data);

  return updatePositionRecord({
    id: Number(id),
    ...data,
  });
}

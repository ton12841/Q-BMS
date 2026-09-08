
import {
  listBusinessUnits,
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

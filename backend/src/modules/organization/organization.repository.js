import { db } from '../../config/database/postgres.js';

export async function listBusinessUnits({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      b.id,
      b.code,
      COALESCE(t.name, b.name) AS name,
      COALESCE(t.description, b.description) AS description,
      b.status,
      b.sort_order,
      b.created_at,
      b.updated_at
    FROM business_units b
    LEFT JOIN business_unit_translations t
      ON t.business_unit_id = b.id
      AND t.locale = $1
    ORDER BY b.sort_order, b.name
  `, [locale]);

  return result.rows;
}

export async function listJobLevels({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      l.id,
      l.code,
      COALESCE(t.name, l.name) AS name,
      COALESCE(t.description, l.description) AS description,
      l.status,
      l.sort_order,
      l.created_at,
      l.updated_at
    FROM job_levels l
    LEFT JOIN job_level_translations t
      ON t.job_level_id = l.id
      AND t.locale = $1
    ORDER BY l.sort_order, l.id
  `, [locale]);

  return result.rows;
}

export async function listJobGrades({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      g.id,
      g.job_level_id,
      l.code AS job_level_code,
      COALESCE(lt.name, l.name) AS job_level_name,
      COALESCE(lt.description, l.description) AS job_level_description,
      l.sort_order AS job_level_sort_order,
      g.grade_number,
      COALESCE(gt.name, g.name) AS name,
      COALESCE(gt.experience_requirement, g.experience_requirement) AS experience_requirement,
      COALESCE(gt.education_requirement, g.education_requirement) AS education_requirement,
      COALESCE(gt.description, g.description) AS description,
      g.status,
      g.sort_order,
      g.created_at,
      g.updated_at
    FROM job_grades g
    INNER JOIN job_levels l
      ON l.id = g.job_level_id
    LEFT JOIN job_level_translations lt
      ON lt.job_level_id = l.id
      AND lt.locale = $1
    LEFT JOIN job_grade_translations gt
      ON gt.job_grade_id = g.id
      AND gt.locale = $1
    ORDER BY l.sort_order, g.sort_order, g.grade_number
  `, [locale]);

  return result.rows;
}

export async function listJobFamilies({ locale = 'en' } = {}) {
  const result = await db.query(`
    SELECT
      f.id,
      f.code,
      COALESCE(t.name, f.name) AS name,
      COALESCE(t.description, f.description) AS description,
      f.status,
      f.sort_order,
      f.created_at,
      f.updated_at,
      (
        SELECT COUNT(*)::int
        FROM positions p
        WHERE p.job_family_id = f.id
      ) AS position_count
    FROM job_families f
    LEFT JOIN job_family_translations t
      ON t.job_family_id = f.id
      AND t.locale = $1
    ORDER BY f.sort_order, f.name
  `, [locale]);

  return result.rows;
}

export async function listPositions({
  locale = 'en',
  jobFamilyId = null,
  jobGradeId = null,
} = {}) {
  const params = [locale];
  const conditions = [];

  if (jobFamilyId) {
    params.push(jobFamilyId);
    conditions.push(`p.job_family_id = $${params.length}`);
  }

  if (jobGradeId) {
    params.push(jobGradeId);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM position_job_grades filter_pjg
        WHERE filter_pjg.position_id = p.id
          AND filter_pjg.job_grade_id = $${params.length}
      )
    `);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await db.query(`
    SELECT
      p.id,
      p.code,
      COALESCE(pt.name, p.name) AS name,
      COALESCE(pt.description, p.description) AS description,
      p.status,
      p.sort_order,
      p.created_at,
      p.updated_at,

      p.job_family_id,
      jf.code AS job_family_code,
      COALESCE(jft.name, jf.name) AS job_family_name,
      COALESCE(jft.description, jf.description) AS job_family_description,

      COALESCE(grade_map.allowed_grades, '[]'::jsonb) AS allowed_grades,
      COALESCE(grade_map.grade_count, 0) AS grade_count

    FROM positions p

    LEFT JOIN position_translations pt
      ON pt.position_id = p.id
      AND pt.locale = $1

    LEFT JOIN job_families jf
      ON jf.id = p.job_family_id

    LEFT JOIN job_family_translations jft
      ON jft.job_family_id = jf.id
      AND jft.locale = $1

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS grade_count,
        jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'grade_number', g.grade_number,
            'name', COALESCE(gt.name, g.name),
            'job_level_id', l.id,
            'job_level_code', l.code,
            'job_level_name', COALESCE(lt.name, l.name),
            'is_primary', pjg.is_primary
          )
          ORDER BY
            l.sort_order,
            g.sort_order,
            g.grade_number
        ) AS allowed_grades
      FROM position_job_grades pjg
      INNER JOIN job_grades g
        ON g.id = pjg.job_grade_id
      INNER JOIN job_levels l
        ON l.id = g.job_level_id
      LEFT JOIN job_grade_translations gt
        ON gt.job_grade_id = g.id
        AND gt.locale = $1
      LEFT JOIN job_level_translations lt
        ON lt.job_level_id = l.id
        AND lt.locale = $1
      WHERE pjg.position_id = p.id
    ) grade_map ON TRUE

    ${where}

    ORDER BY
      jf.sort_order NULLS LAST,
      jf.name NULLS LAST,
      p.sort_order,
      p.name
  `, params);

  return result.rows;
}

export async function getBusinessUnitById(id) {
  const result = await db.query(`
    SELECT id, code, name, description, status, sort_order, created_at, updated_at
    FROM business_units
    WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function insertBusinessUnit({code, name, description, status, sortOrder}) {
  const result = await db.query(`
    INSERT INTO business_units (code, name, description, status, sort_order)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [code, name, description, status, sortOrder]);
  return result.rows[0];
}

export async function updateBusinessUnitRecord({id, code, name, description, status, sortOrder}) {
  const result = await db.query(`
    UPDATE business_units
    SET
      code = $2,
      name = $3,
      description = $4,
      status = $5,
      sort_order = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, code, name, description, status, sortOrder]);
  return result.rows[0] || null;
}

export async function getBusinessUnitUsage(id) {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM employees WHERE primary_business_unit_id = $1) AS employee_primary_count,
      (SELECT COUNT(*)::int FROM employee_business_units WHERE business_unit_id = $1) AS employee_business_unit_count,
      (SELECT COUNT(*)::int FROM employee_assignments WHERE business_unit_id = $1) AS assignment_count
  `, [id]);
  return result.rows[0];
}

export async function deleteBusinessUnitRecord(id) {
  const result = await db.query(`
    DELETE FROM business_units
    WHERE id = $1
    RETURNING id
  `, [id]);
  return result.rows[0] || null;
}

export async function insertOrganizationAuditLog({
  actorUserId = null,
  action,
  entityType,
  entityId,
  metadata = {},
}) {
  await db.query(`
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5::jsonb)
  `, [
    actorUserId || null,
    action,
    entityType,
    String(entityId),
    JSON.stringify(metadata || {}),
  ]);
}

export async function upsertBusinessUnit({
  code,
  name,
  description = null,
  status = 'ACTIVE',
  sortOrder = 0,
}) {
  const result = await db.query(`
    INSERT INTO business_units (
      code,
      name,
      description,
      status,
      sort_order
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (code)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW()
    RETURNING *
  `, [code, name, description, status, sortOrder]);

  return result.rows[0];
}


export async function getJobFamilyById({
  id,
  locale = 'en',
}) {
  const result = await db.query(`
    SELECT
      f.id,
      f.code,
      COALESCE(t.name, f.name) AS name,
      COALESCE(t.description, f.description) AS description,
      f.status,
      f.sort_order,
      f.created_at,
      f.updated_at,
      (
        SELECT COUNT(*)::int
        FROM positions p
        WHERE p.job_family_id = f.id
      ) AS position_count
    FROM job_families f
    LEFT JOIN job_family_translations t
      ON t.job_family_id = f.id
      AND t.locale = $2
    WHERE f.id = $1
  `, [id, locale]);

  if (!result.rows[0]) {
    return null;
  }

  const translationsResult = await db.query(`
    SELECT
      locale,
      name,
      description,
      translation_status
    FROM job_family_translations
    WHERE job_family_id = $1
    ORDER BY locale
  `, [id]);

  const translations = Object.fromEntries(
    translationsResult.rows.map((row) => [
      row.locale,
      {
        name: row.name,
        description: row.description,
        translation_status: row.translation_status,
      },
    ])
  );

  return {
    ...result.rows[0],
    translations,
  };
}

async function syncJobFamilyTranslations(
  client,
  jobFamilyId,
  translations
) {
  for (const locale of ['en', 'th', 'lo']) {
    const translation = translations?.[locale] || {};
    const name = String(translation.name || '').trim();
    const description =
      String(translation.description || '').trim() || null;

    if (!name && locale !== 'en') {
      await client.query(`
        DELETE FROM job_family_translations
        WHERE job_family_id = $1
          AND locale = $2
      `, [jobFamilyId, locale]);

      continue;
    }

    if (!name) {
      continue;
    }

    await client.query(`
      INSERT INTO job_family_translations (
        job_family_id,
        locale,
        name,
        description,
        translation_status
      )
      VALUES ($1, $2, $3, $4, 'APPROVED')
      ON CONFLICT (job_family_id, locale)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        translation_status = EXCLUDED.translation_status,
        updated_at = NOW()
    `, [jobFamilyId, locale, name, description]);
  }
}

export async function insertJobFamily({
  code,
  name,
  description = null,
  status = 'ACTIVE',
  sortOrder = 0,
  translations = {},
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO job_families (
        code,
        name,
        description,
        status,
        sort_order
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [code, name, description, status, sortOrder]);

    await syncJobFamilyTranslations(
      client,
      result.rows[0].id,
      translations
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

export async function updateJobFamilyRecord({
  id,
  code,
  name,
  description = null,
  status = 'ACTIVE',
  sortOrder = 0,
  translations = {},
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE job_families
      SET
        code = $2,
        name = $3,
        description = $4,
        status = $5,
        sort_order = $6,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      code,
      name,
      description,
      status,
      sortOrder,
    ]);

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await syncJobFamilyTranslations(
      client,
      id,
      translations
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


export async function getPositionById({
  id,
  locale = 'en',
}) {
  const result = await db.query(`
    SELECT
      p.id,
      p.code,
      COALESCE(pt.name, p.name) AS name,
      COALESCE(pt.description, p.description) AS description,
      p.status,
      p.sort_order,
      p.created_at,
      p.updated_at,

      p.job_family_id,
      jf.code AS job_family_code,
      COALESCE(jft.name, jf.name) AS job_family_name,
      COALESCE(jft.description, jf.description) AS job_family_description,

      COALESCE(grade_map.allowed_grades, '[]'::jsonb) AS allowed_grades,
      COALESCE(grade_map.grade_count, 0) AS grade_count

    FROM positions p

    LEFT JOIN position_translations pt
      ON pt.position_id = p.id
      AND pt.locale = $2

    LEFT JOIN job_families jf
      ON jf.id = p.job_family_id

    LEFT JOIN job_family_translations jft
      ON jft.job_family_id = jf.id
      AND jft.locale = $2

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS grade_count,
        jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'grade_number', g.grade_number,
            'name', COALESCE(gt.name, g.name),
            'job_level_id', l.id,
            'job_level_code', l.code,
            'job_level_name', COALESCE(lt.name, l.name),
            'is_primary', pjg.is_primary
          )
          ORDER BY
            l.sort_order,
            g.sort_order,
            g.grade_number
        ) AS allowed_grades
      FROM position_job_grades pjg
      INNER JOIN job_grades g
        ON g.id = pjg.job_grade_id
      INNER JOIN job_levels l
        ON l.id = g.job_level_id
      LEFT JOIN job_grade_translations gt
        ON gt.job_grade_id = g.id
        AND gt.locale = $2
      LEFT JOIN job_level_translations lt
        ON lt.job_level_id = l.id
        AND lt.locale = $2
      WHERE pjg.position_id = p.id
    ) grade_map ON TRUE

    WHERE p.id = $1
  `, [id, locale]);

  if (!result.rows[0]) {
    return null;
  }

  const translationsResult = await db.query(`
    SELECT
      locale,
      name,
      description,
      translation_status
    FROM position_translations
    WHERE position_id = $1
    ORDER BY locale
  `, [id]);

  const translations = Object.fromEntries(
    translationsResult.rows.map((row) => [
      row.locale,
      {
        name: row.name,
        description: row.description,
        translation_status: row.translation_status,
      },
    ])
  );

  return {
    ...result.rows[0],
    translations,
  };
}

export async function validatePositionReferences({
  jobFamilyId,
  jobGradeIds,
}) {
  const result = await db.query(`
    SELECT
      EXISTS (
        SELECT 1
        FROM job_families
        WHERE id = $1
          AND status = 'ACTIVE'
      ) AS job_family_exists,
      (
        SELECT COUNT(*)::int
        FROM job_grades
        WHERE id = ANY($2::bigint[])
          AND status = 'ACTIVE'
      ) AS active_grade_count
  `, [jobFamilyId, jobGradeIds]);

  return result.rows[0];
}

async function syncPositionTranslations(
  client,
  positionId,
  translations
) {
  for (const locale of ['en', 'th', 'lo']) {
    const translation = translations?.[locale] || {};
    const name = String(translation.name || '').trim();
    const description =
      String(translation.description || '').trim() || null;

    if (!name && locale !== 'en') {
      await client.query(`
        DELETE FROM position_translations
        WHERE position_id = $1
          AND locale = $2
      `, [positionId, locale]);

      continue;
    }

    if (!name) {
      continue;
    }

    await client.query(`
      INSERT INTO position_translations (
        position_id,
        locale,
        name,
        description,
        translation_status
      )
      VALUES ($1, $2, $3, $4, 'APPROVED')
      ON CONFLICT (position_id, locale)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        translation_status = EXCLUDED.translation_status,
        updated_at = NOW()
    `, [
      positionId,
      locale,
      name,
      description,
    ]);
  }
}

async function syncPositionJobGrades(
  client,
  positionId,
  jobGradeIds
) {
  await client.query(`
    DELETE FROM position_job_grades
    WHERE position_id = $1
  `, [positionId]);

  for (let index = 0; index < jobGradeIds.length; index += 1) {
    await client.query(`
      INSERT INTO position_job_grades (
        position_id,
        job_grade_id,
        is_primary,
        sort_order
      )
      VALUES ($1, $2, FALSE, $3)
    `, [
      positionId,
      jobGradeIds[index],
      index,
    ]);
  }
}

export async function insertPosition({
  code,
  name,
  description = null,
  jobFamilyId,
  jobGradeIds,
  status = 'ACTIVE',
  sortOrder = 0,
  translations = {},
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO positions (
        code,
        name,
        description,
        job_family_id,
        business_unit_id,
        job_grade_id,
        department_id,
        job_level,
        status,
        sort_order
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NULL,
        NULL,
        NULL,
        NULL,
        $5,
        $6
      )
      RETURNING *
    `, [
      code,
      name,
      description,
      jobFamilyId,
      status,
      sortOrder,
    ]);

    const positionId = result.rows[0].id;

    await syncPositionTranslations(
      client,
      positionId,
      translations
    );

    await syncPositionJobGrades(
      client,
      positionId,
      jobGradeIds
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

export async function updatePositionRecord({
  id,
  code,
  name,
  description = null,
  jobFamilyId,
  jobGradeIds,
  status = 'ACTIVE',
  sortOrder = 0,
  translations = {},
}) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE positions
      SET
        code = $2,
        name = $3,
        description = $4,
        job_family_id = $5,
        business_unit_id = NULL,
        job_grade_id = NULL,
        department_id = NULL,
        job_level = NULL,
        status = $6,
        sort_order = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      code,
      name,
      description,
      jobFamilyId,
      status,
      sortOrder,
    ]);

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    await syncPositionTranslations(
      client,
      id,
      translations
    );

    await syncPositionJobGrades(
      client,
      id,
      jobGradeIds
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

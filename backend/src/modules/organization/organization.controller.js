
import { normalizeLocale } from '../../core/i18n/i18n.js';
import {
  getOrganizationMaster,
  getBusinessUnits,
  createBusinessUnit,
  updateBusinessUnit,
  removeBusinessUnit,
  getJobLevels,
  getJobGrades,
  getLevelGradeStructure,
  getJobFamilies,
  getPositions,
  getJobFamily,
  createJobFamily,
  updateJobFamily,
  getPosition,
  createPosition,
  updatePosition,
} from './organization.service.js';

function requestLocale(req) {
  return normalizeLocale(
    req.query.lang ||
    req.headers['x-qbms-locale'] ||
    req.headers['accept-language']
  );
}

export async function organizationMasterController(req, res, next) {
  try {
    const data = await getOrganizationMaster({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function businessUnitsController(req, res, next) {
  try {
    const data = await getBusinessUnits({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

function handleBusinessUnitWriteError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details || undefined,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Business Unit code already exists.',
    });
  }

  if (error?.code === '23503') {
    return res.status(409).json({
      success: false,
      message: 'Business Unit is referenced by existing data and cannot be deleted.',
    });
  }

  return next(error);
}

export async function createBusinessUnitController(req, res, next) {
  try {
    const data = await createBusinessUnit(
      req.body,
      req.auth?.user?.id || null
    );

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleBusinessUnitWriteError(error, res, next);
  }
}

export async function updateBusinessUnitController(req, res, next) {
  try {
    const data = await updateBusinessUnit({
      id: Number(req.params.id),
      payload: req.body,
      actorUserId: req.auth?.user?.id || null,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Business Unit not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleBusinessUnitWriteError(error, res, next);
  }
}

export async function deleteBusinessUnitController(req, res, next) {
  try {
    const data = await removeBusinessUnit({
      id: Number(req.params.id),
      actorUserId: req.auth?.user?.id || null,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Business Unit not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleBusinessUnitWriteError(error, res, next);
  }
}


export async function jobLevelsController(req, res, next) {
  try {
    const data = await getJobLevels({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function jobGradesController(req, res, next) {
  try {
    const data = await getJobGrades({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function levelGradeStructureController(req, res, next) {
  try {
    const data = await getLevelGradeStructure({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function jobFamiliesController(req, res, next) {
  try {
    const data = await getJobFamilies({
      locale: requestLocale(req),
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function positionsController(req, res, next) {
  try {
    const jobFamilyId = req.query.job_family_id
      ? Number(req.query.job_family_id)
      : null;

    const jobGradeId = req.query.job_grade_id
      ? Number(req.query.job_grade_id)
      : null;

    const data = await getPositions({
      locale: requestLocale(req),
      jobFamilyId,
      jobGradeId,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}


function handleJobFamilyWriteError(
  error,
  res,
  next
) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Job Family code already exists.',
    });
  }

  return next(error);
}

export async function jobFamilyDetailController(
  req,
  res,
  next
) {
  try {
    const data = await getJobFamily({
      id: Number(req.params.id),
      locale: requestLocale(req),
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Job Family not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createJobFamilyController(
  req,
  res,
  next
) {
  try {
    const data = await createJobFamily(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleJobFamilyWriteError(
      error,
      res,
      next
    );
  }
}

export async function updateJobFamilyController(
  req,
  res,
  next
) {
  try {
    const data = await updateJobFamily({
      id: Number(req.params.id),
      payload: req.body,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Job Family not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return handleJobFamilyWriteError(
      error,
      res,
      next
    );
  }
}


function handlePositionWriteError(
  error,
  res,
  next
) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Position code already exists.',
    });
  }

  if (error?.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Position references an unavailable organization master record.',
    });
  }

  return next(error);
}

export async function positionDetailController(
  req,
  res,
  next
) {
  try {
    const data = await getPosition({
      id: Number(req.params.id),
      locale: requestLocale(req),
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Position not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createPositionController(
  req,
  res,
  next
) {
  try {
    const data =
      await createPosition(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return handlePositionWriteError(
      error,
      res,
      next
    );
  }
}

export async function updatePositionController(
  req,
  res,
  next
) {
  try {
    const data = await updatePosition({
      id: Number(req.params.id),
      payload: req.body,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Position not found.',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return handlePositionWriteError(
      error,
      res,
      next
    );
  }
}

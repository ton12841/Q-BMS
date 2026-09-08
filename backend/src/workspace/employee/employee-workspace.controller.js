import { loadMyEmployeeWorkspace } from './employee-workspace.service.js';

function localeOf(req) {
  const locale = String(req.query.lang || 'en').toLowerCase();
  return ['en', 'th', 'lo'].includes(locale) ? locale : 'en';
}

export async function getMyEmployeeWorkspaceController(req, res, next) {
  try {
    const data = await loadMyEmployeeWorkspace({
      auth: req.auth,
      locale: localeOf(req),
    });
    return res.json({ success: true, data });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code || null,
      });
    }
    return next(error);
  }
}

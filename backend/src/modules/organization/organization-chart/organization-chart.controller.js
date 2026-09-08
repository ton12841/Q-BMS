import { normalizeLocale } from '../../../core/i18n/i18n.js';
import { getOrganizationChart } from './organization-chart.service.js';

function localeOf(req) {
  return normalizeLocale(
    req.query.lang ||
    req.headers['x-qbms-locale'] ||
    req.headers['accept-language']
  );
}

export async function organizationChartController(req, res, next) {
  try {
    const data = await getOrganizationChart({ locale: localeOf(req) });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

import { getOnboardingE2EQa, listOnboardingE2EQa } from './onboarding-e2e.service.js';

function handle(error, res, next) {
  if (error?.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
  return next(error);
}

export async function listOnboardingE2EQaController(req, res, next) {
  try {
    return res.json({ success: true, data: await listOnboardingE2EQa() });
  } catch (error) { return handle(error, res, next); }
}

export async function getOnboardingE2EQaController(req, res, next) {
  try {
    const data = await getOnboardingE2EQa(req.params.employeeId);
    if (!data) return res.status(404).json({ success: false, message: 'Employee not found.' });
    return res.json({ success: true, data });
  } catch (error) { return handle(error, res, next); }
}

import { Router } from 'express';
import { getAuditLogOverview } from './audit-log.service.js';

export const auditLogRouter = Router();

auditLogRouter.get('/overview', async (req, res) => {
  try {
    const data = await getAuditLogOverview({
      query: req.query.q,
      action: req.query.action,
      entityType: req.query.entityType,
      actorUserId: req.query.actorUserId,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || 'AUDIT_LOG_OVERVIEW_FAILED',
      message: error.message || 'Unable to load Audit Log.',
    });
  }
});

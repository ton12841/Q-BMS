import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'q-bms-api',
    version: '2.0.0.0',
    status: 'ok'
  });
});

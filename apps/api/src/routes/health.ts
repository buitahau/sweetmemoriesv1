import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok' });
});

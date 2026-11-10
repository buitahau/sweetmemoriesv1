import { Router } from 'express';

export function commitFrom(value: string | undefined): string {
  return value !== undefined && /^[0-9a-f]{40}$/.test(value) ? value : 'unknown';
}

export const versionRouter = Router();

versionRouter.get('/version', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ commit: commitFrom(process.env.GIT_SHA) });
});

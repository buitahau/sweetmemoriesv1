import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';

export function createApp(options: { testRoutes?: (app: Express) => void } = {}): Express {
  const app = express();
  app.disable('x-powered-by');

  // Routes of later tasks are registered here.

  options.testRoutes?.(app);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'not_found' });
  });

  // Express recognizes an error handler by its four arguments.
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}

import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../lib/apiError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  if (env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(status).json({
    error: { message: status >= 500 ? 'Internal server error' : message },
  });
}

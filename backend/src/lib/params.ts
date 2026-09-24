import { Request } from 'express';
import { ApiError } from './apiError';

/** Express 5 types req.params values as string | string[] (path-to-regexp repeatable params). */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw ApiError.badRequest(`Missing route parameter: ${name}`);
  }
  return value;
}

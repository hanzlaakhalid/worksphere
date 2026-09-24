import type { AuthTokenPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      validated?: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

export {};

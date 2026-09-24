import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodError } from 'zod';

/**
 * Validates { body, query, params } against schema and stores the coerced
 * result on req.validated (rather than reassigning req.query/req.params,
 * which Express 5 exposes as getters in some configurations).
 */
export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });

    if (!result.success) {
      const fieldErrors = (result.error as ZodError).flatten
        ? flattenFieldErrors(result.error as ZodError)
        : {};
      res.status(422).json({ error: { message: 'Validation failed', fields: fieldErrors } });
      return;
    }

    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    req.validated = parsed;
    next();
  };
}

function flattenFieldErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.slice(1).join('.') || issue.path.join('.');
    fields[key] = [...(fields[key] ?? []), issue.message];
  }
  return fields;
}

import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/api-error.model';

const DEFAULT_MESSAGE = 'Something went wrong. Please try again.';

export function extractErrorMessage(err: unknown, fallback = DEFAULT_MESSAGE): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiErrorBody> | null;
    if (body?.error?.message) {
      return body.error.message;
    }
  }
  return fallback;
}

export function extractFieldErrors(err: unknown): Record<string, string[]> | null {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as Partial<ApiErrorBody> | null;
    if (body?.error?.fields) {
      return body.error.fields;
    }
  }
  return null;
}

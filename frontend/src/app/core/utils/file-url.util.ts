import { environment } from '../../../environments/environment';

/** Resolves a backend-relative file path (e.g. "/uploads/x.png") to a full URL. */
export function resolveFileUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return /^https?:\/\//.test(path) ? path : `${environment.filesBaseUrl}${path}`;
}

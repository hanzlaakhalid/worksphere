import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { TokenStorage } from '../auth/token-storage';
import { AuthActions } from '../state/auth/auth.actions';

/** Endpoints where a 401 is a normal business response (bad credentials), not an expired session. */
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);
  const router = inject(Router);
  const store = inject(Store);

  const token = tokenStorage.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !isPublicAuthRequest) {
        if (error.status === 401) {
          store.dispatch(AuthActions.logout());
        } else if (error.status === 403) {
          router.navigateByUrl('/forbidden');
        }
      }
      return throwError(() => error);
    }),
  );
};

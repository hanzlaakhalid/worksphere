import { Service, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthActions } from './auth.actions';
import { AuthApi } from '../../auth/auth-api';
import { TokenStorage } from '../../auth/token-storage';
import { extractErrorMessage } from '../../utils/http-error.util';
import { dashboardRouteForRole } from '../../utils/role-routes.util';

@Service()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthApi);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ request, returnUrl }) =>
        this.authApi.login(request).pipe(
          tap(({ accessToken }) => this.tokenStorage.setToken(accessToken)),
          tap(({ user }) => this.router.navigateByUrl(returnUrl || dashboardRouteForRole(user.role))),
          map(({ user, accessToken }) => AuthActions.loginSuccess({ user, accessToken })),
          catchError((err) => of(AuthActions.loginFailure({ error: extractErrorMessage(err, 'Invalid email or password') }))),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ request }) =>
        this.authApi.register(request).pipe(
          map(({ user, accessToken }) => {
            this.tokenStorage.setToken(accessToken);
            return AuthActions.registerSuccess({ user, accessToken });
          }),
          catchError((err) => of(AuthActions.registerFailure({ error: extractErrorMessage(err, 'Could not create your account') }))),
        ),
      ),
    ),
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() => {
        if (!this.tokenStorage.getToken()) {
          return of(AuthActions.loadCurrentUserFailure());
        }
        return this.authApi.me().pipe(
          map(({ user }) => AuthActions.loadCurrentUserSuccess({ user })),
          catchError(() => {
            this.tokenStorage.clearToken();
            return of(AuthActions.loadCurrentUserFailure());
          }),
        );
      }),
    ),
  );

  redirectAfterRegister$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ user }) => this.router.navigateByUrl(dashboardRouteForRole(user.role))),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.tokenStorage.clearToken();
          this.router.navigateByUrl('/login');
        }),
      ),
    { dispatch: false },
  );
}

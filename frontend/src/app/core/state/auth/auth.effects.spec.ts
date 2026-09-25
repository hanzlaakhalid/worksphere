import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { AuthEffects } from './auth.effects';
import { AuthActions } from './auth.actions';
import { AuthApi } from '../../auth/auth-api';
import { TokenStorage } from '../../auth/token-storage';
import { User } from '../../models/user.model';

const testUser: User = {
  id: '1',
  email: 'employee1@worksphere.local',
  firstName: 'Sofia',
  lastName: 'Costa',
  role: 'EMPLOYEE',
  isActive: true,
  createdAt: new Date().toISOString(),
};

function configure() {
  const actions$ = new Subject();
  const authApiStub = { login: vi.fn(), register: vi.fn(), me: vi.fn() };
  const tokenStorageStub = { getToken: vi.fn(), setToken: vi.fn(), clearToken: vi.fn() };
  const routerStub = { navigateByUrl: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      AuthEffects,
      provideMockActions(() => actions$),
      { provide: AuthApi, useValue: authApiStub },
      { provide: TokenStorage, useValue: tokenStorageStub },
      { provide: Router, useValue: routerStub },
    ],
  });

  const effects = TestBed.inject(AuthEffects);
  return { effects, actions$, authApiStub, tokenStorageStub, routerStub };
}

describe('AuthEffects', () => {
  it('login$ stores the token, navigates to the role dashboard, and dispatches loginSuccess', async () => {
    const setup = configure();
    setup.authApiStub.login.mockReturnValue(of({ user: testUser, accessToken: 'tok-1' }));

    const result = firstValueFrom(setup.effects.login$);
    setup.actions$.next(AuthActions.login({ request: { email: testUser.email, password: 'pw' } }));
    const action = await result;

    expect(setup.tokenStorageStub.setToken).toHaveBeenCalledWith('tok-1');
    expect(setup.routerStub.navigateByUrl).toHaveBeenCalledWith('/employee/dashboard');
    expect(action).toEqual(AuthActions.loginSuccess({ user: testUser, accessToken: 'tok-1' }));
  });

  it('login$ navigates to the returnUrl when one is given instead of the role dashboard', async () => {
    const setup = configure();
    setup.authApiStub.login.mockReturnValue(of({ user: testUser, accessToken: 'tok-1' }));

    const result = firstValueFrom(setup.effects.login$);
    setup.actions$.next(AuthActions.login({ request: { email: testUser.email, password: 'pw' }, returnUrl: '/employee/leave' }));
    await result;

    expect(setup.routerStub.navigateByUrl).toHaveBeenCalledWith('/employee/leave');
  });

  it('login$ dispatches loginFailure with a sanitized message and never stores a token on failure', async () => {
    const setup = configure();
    setup.authApiStub.login.mockReturnValue(
      throwError(() => ({ error: { error: { message: 'Invalid credentials' } } })),
    );

    const result = firstValueFrom(setup.effects.login$);
    setup.actions$.next(AuthActions.login({ request: { email: testUser.email, password: 'wrong' } }));
    const action = await result;

    expect(setup.tokenStorageStub.setToken).not.toHaveBeenCalled();
    expect(setup.routerStub.navigateByUrl).not.toHaveBeenCalled();
    expect(action).toEqual(AuthActions.loginFailure({ error: 'Invalid email or password' }));
  });

  it('register$ stores the token and dispatches registerSuccess', async () => {
    const setup = configure();
    setup.authApiStub.register.mockReturnValue(of({ user: testUser, accessToken: 'tok-2' }));

    const result = firstValueFrom(setup.effects.register$);
    setup.actions$.next(
      AuthActions.register({ request: { email: testUser.email, password: 'pw', firstName: 'Sofia', lastName: 'Costa' } }),
    );
    const action = await result;

    expect(setup.tokenStorageStub.setToken).toHaveBeenCalledWith('tok-2');
    expect(action).toEqual(AuthActions.registerSuccess({ user: testUser, accessToken: 'tok-2' }));
  });

  it('register$ dispatches registerFailure on error', async () => {
    const setup = configure();
    setup.authApiStub.register.mockReturnValue(throwError(() => ({ status: 409 })));

    const result = firstValueFrom(setup.effects.register$);
    setup.actions$.next(
      AuthActions.register({ request: { email: testUser.email, password: 'pw', firstName: 'Sofia', lastName: 'Costa' } }),
    );
    const action = await result;

    expect(action).toEqual(AuthActions.registerFailure({ error: 'Could not create your account' }));
  });

  it('redirectAfterRegister$ navigates to the role dashboard on registerSuccess', async () => {
    const setup = configure();
    setup.effects.redirectAfterRegister$.subscribe();

    setup.actions$.next(AuthActions.registerSuccess({ user: testUser, accessToken: 'tok-2' }));
    await Promise.resolve();

    expect(setup.routerStub.navigateByUrl).toHaveBeenCalledWith('/employee/dashboard');
  });

  it('loadCurrentUser$ skips the API call and dispatches failure immediately when there is no stored token', async () => {
    const setup = configure();
    setup.tokenStorageStub.getToken.mockReturnValue(null);

    const result = firstValueFrom(setup.effects.loadCurrentUser$);
    setup.actions$.next(AuthActions.loadCurrentUser());
    const action = await result;

    expect(setup.authApiStub.me).not.toHaveBeenCalled();
    expect(action).toEqual(AuthActions.loadCurrentUserFailure());
  });

  it('loadCurrentUser$ dispatches success when a stored token resolves to a user', async () => {
    const setup = configure();
    setup.tokenStorageStub.getToken.mockReturnValue('tok-3');
    setup.authApiStub.me.mockReturnValue(of({ user: testUser }));

    const result = firstValueFrom(setup.effects.loadCurrentUser$);
    setup.actions$.next(AuthActions.loadCurrentUser());
    const action = await result;

    expect(action).toEqual(AuthActions.loadCurrentUserSuccess({ user: testUser }));
  });

  it('loadCurrentUser$ clears the stale token and dispatches failure when the stored token is rejected', async () => {
    const setup = configure();
    setup.tokenStorageStub.getToken.mockReturnValue('expired-tok');
    setup.authApiStub.me.mockReturnValue(throwError(() => ({ status: 401 })));

    const result = firstValueFrom(setup.effects.loadCurrentUser$);
    setup.actions$.next(AuthActions.loadCurrentUser());
    const action = await result;

    expect(setup.tokenStorageStub.clearToken).toHaveBeenCalled();
    expect(action).toEqual(AuthActions.loadCurrentUserFailure());
  });

  it('logout$ clears the token and navigates to /login', async () => {
    const setup = configure();
    setup.effects.logout$.subscribe();

    setup.actions$.next(AuthActions.logout());
    await Promise.resolve();

    expect(setup.tokenStorageStub.clearToken).toHaveBeenCalled();
    expect(setup.routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});

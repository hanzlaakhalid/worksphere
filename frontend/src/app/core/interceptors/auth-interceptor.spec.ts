import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { firstValueFrom, of, throwError, Observable } from 'rxjs';
import { authInterceptor } from './auth-interceptor';
import { TokenStorage } from '../auth/token-storage';
import { AuthActions } from '../state/auth/auth.actions';

function configure(token: string | null) {
  const tokenStorageStub = { getToken: vi.fn().mockReturnValue(token) };
  const storeStub = { dispatch: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: TokenStorage, useValue: tokenStorageStub },
      { provide: Store, useValue: storeStub },
    ],
  });

  const router = TestBed.inject(Router);
  const navigateSpy = vi.spyOn(router, 'navigateByUrl');

  const run = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  return { tokenStorageStub, storeStub, navigateSpy, run };
}

describe('authInterceptor', () => {
  it('attaches the Authorization header when a token is stored', async () => {
    const setup = configure('tok-123');
    const req = new HttpRequest('GET', '/api/employees');
    let capturedReq: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (r) => {
      capturedReq = r;
      return of({ type: 4 } as HttpEvent<unknown>);
    };

    await firstValueFrom(setup.run(req, next));

    expect(capturedReq?.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('does not attach an Authorization header when there is no stored token', async () => {
    const setup = configure(null);
    const req = new HttpRequest('GET', '/api/employees');
    let capturedReq: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (r) => {
      capturedReq = r;
      return of({ type: 4 } as HttpEvent<unknown>);
    };

    await firstValueFrom(setup.run(req, next));

    expect(capturedReq?.headers.has('Authorization')).toBe(false);
  });

  it('dispatches logout on a 401 from a protected endpoint', async () => {
    const setup = configure('expired-tok');
    const req = new HttpRequest('GET', '/api/employees');
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    await expect(firstValueFrom(setup.run(req, next))).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(setup.storeStub.dispatch).toHaveBeenCalledWith(AuthActions.logout());
  });

  it('does not dispatch logout on a 401 from the login endpoint (bad credentials, not an expired session)', async () => {
    const setup = configure(null);
    const req = new HttpRequest('POST', '/api/auth/login', {});
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/auth/login' }));

    await expect(firstValueFrom(setup.run(req, next))).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(setup.storeStub.dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch logout on a 401 from the register endpoint', async () => {
    const setup = configure(null);
    const req = new HttpRequest('POST', '/api/auth/register', {});
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 401, url: '/api/auth/register' }));

    await expect(firstValueFrom(setup.run(req, next))).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(setup.storeStub.dispatch).not.toHaveBeenCalled();
  });

  it('redirects to /forbidden on a 403', async () => {
    const setup = configure('tok-123');
    const req = new HttpRequest('GET', '/api/payroll');
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 403 }));

    await expect(firstValueFrom(setup.run(req, next))).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(setup.navigateSpy).toHaveBeenCalledWith('/forbidden');
    expect(setup.storeStub.dispatch).not.toHaveBeenCalled();
  });

  it('passes through other error statuses without dispatching logout or redirecting', async () => {
    const setup = configure('tok-123');
    const req = new HttpRequest('GET', '/api/employees');
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 500 }));

    await expect(firstValueFrom(setup.run(req, next))).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(setup.storeStub.dispatch).not.toHaveBeenCalled();
    expect(setup.navigateSpy).not.toHaveBeenCalled();
  });

  it('passes through a successful response untouched', async () => {
    const setup = configure('tok-123');
    const req = new HttpRequest('GET', '/api/employees');
    const next: HttpHandlerFn = () => of({ type: 4, body: { data: [] } } as unknown as HttpEvent<unknown>);

    const event = await firstValueFrom(setup.run(req, next));

    expect(event).toEqual({ type: 4, body: { data: [] } });
    expect(setup.storeStub.dispatch).not.toHaveBeenCalled();
  });
});

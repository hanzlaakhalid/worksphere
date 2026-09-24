import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthFacade } from '../state/auth/auth.facade';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authFacadeStub: { isAuthenticated: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authFacadeStub = { isAuthenticated: vi.fn() };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthFacade, useValue: authFacadeStub }],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('allows navigation when the user is authenticated', () => {
    authFacadeStub.isAuthenticated.mockReturnValue(true);

    const result = executeGuard({} as never, { url: '/home' } as never);

    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when not authenticated', () => {
    authFacadeStub.isAuthenticated.mockReturnValue(false);
    const router = TestBed.inject(Router);

    const result = executeGuard({} as never, { url: '/home' } as never) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fhome');
  });
});

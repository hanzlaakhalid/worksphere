import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router, UrlTree } from '@angular/router';
import { roleGuard } from './role-guard';
import { AuthFacade } from '../state/auth/auth.facade';

describe('roleGuard', () => {
  let authFacadeStub: { isAuthenticated: ReturnType<typeof vi.fn>; role: ReturnType<typeof vi.fn> };

  const executeGuard = (allowedRoles: ('ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE')[]): ReturnType<CanActivateFn> =>
    TestBed.runInInjectionContext(() =>
      roleGuard(allowedRoles)({} as never, { url: '/admin-only' } as never),
    );

  beforeEach(() => {
    authFacadeStub = {
      isAuthenticated: vi.fn(),
      role: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthFacade, useValue: authFacadeStub }],
    });
  });

  it('allows navigation when the user has an allowed role', () => {
    authFacadeStub.isAuthenticated.mockReturnValue(true);
    authFacadeStub.role.mockReturnValue('ADMIN');

    expect(executeGuard(['ADMIN'])).toBe(true);
  });

  it('redirects to /forbidden when the user is authenticated but lacks the role', () => {
    authFacadeStub.isAuthenticated.mockReturnValue(true);
    authFacadeStub.role.mockReturnValue('EMPLOYEE');
    const router = TestBed.inject(Router);

    const result = executeGuard(['ADMIN']) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result)).toBe('/forbidden');
  });

  it('redirects to /login when the user is not authenticated', () => {
    authFacadeStub.isAuthenticated.mockReturnValue(false);
    authFacadeStub.role.mockReturnValue(null);
    const router = TestBed.inject(Router);

    const result = executeGuard(['ADMIN']) as UrlTree;

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fadmin-only');
  });
});

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../state/auth/auth.facade';
import { Role } from '../models/user.model';

export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return (_route, state) => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    if (!authFacade.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const role = authFacade.role();
    if (!role || !allowedRoles.includes(role)) {
      return router.createUrlTree(['/forbidden']);
    }

    return true;
  };
}

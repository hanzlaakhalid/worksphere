import { inject } from '@angular/core';
import type { RedirectFunction } from '@angular/router';
import { AuthFacade } from '../state/auth/auth.facade';
import { dashboardRouteForRole } from '../utils/role-routes.util';

/** Sends '' and unmatched URLs to the current user's dashboard, or /login if signed out. */
export const roleHomeRedirect: RedirectFunction = () => {
  const authFacade = inject(AuthFacade);
  const role = authFacade.role();
  return role ? dashboardRouteForRole(role) : '/login';
};

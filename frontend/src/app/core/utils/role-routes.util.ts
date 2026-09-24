import { Role } from '../models/user.model';

const DASHBOARD_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  HR_MANAGER: '/hr/dashboard',
  MANAGER: '/manager/dashboard',
  EMPLOYEE: '/employee/dashboard',
};

export function dashboardRouteForRole(role: Role): string {
  return DASHBOARD_ROUTE_BY_ROLE[role];
}

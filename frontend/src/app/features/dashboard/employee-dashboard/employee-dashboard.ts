import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { NAV_ITEMS_BY_ROLE } from '../../../core/config/nav-items.config';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  imports: [DashboardCard, EmptyState],
  selector: 'app-employee-dashboard',
  styleUrl: './employee-dashboard.scss',
  templateUrl: './employee-dashboard.html',
})
export class EmployeeDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.EMPLOYEE.filter((item) => item.route !== '/employee/dashboard');
}

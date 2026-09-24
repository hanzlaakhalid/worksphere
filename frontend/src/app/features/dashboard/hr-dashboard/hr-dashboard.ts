import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { NAV_ITEMS_BY_ROLE } from '../../../core/config/nav-items.config';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  imports: [DashboardCard, EmptyState],
  selector: 'app-hr-dashboard',
  styleUrl: './hr-dashboard.scss',
  templateUrl: './hr-dashboard.html',
})
export class HrDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.HR_MANAGER.filter((item) => item.route !== '/hr/dashboard');
}

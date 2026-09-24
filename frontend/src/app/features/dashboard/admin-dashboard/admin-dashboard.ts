import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { NAV_ITEMS_BY_ROLE } from '../../../core/config/nav-items.config';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  imports: [DashboardCard, EmptyState],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.scss',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.ADMIN.filter((item) => item.route !== '/admin/dashboard');
}

import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { NAV_ITEMS_BY_ROLE } from '../../../core/config/nav-items.config';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { DashboardWidget } from '../../../shared/ui/dashboard-widget/dashboard-widget';
import { DashboardApi } from '../../../core/dashboard/dashboard-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { LeaveSummary } from '../../../core/models/dashboard.model';
import { Announcement } from '../../../core/models/announcement.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

const LEAVE_TYPE_COLORS = ['#3f51b5', '#00bcd4', '#8bc34a', '#ff9800', '#9c27b0'];

interface DashboardData {
  leaveSummary: LeaveSummary;
  announcements: Announcement[];
}

@Component({
  imports: [DatePipe, BaseChartDirective, DashboardCard, DashboardWidget],
  selector: 'app-employee-dashboard',
  styleUrl: './employee-dashboard.scss',
  templateUrl: './employee-dashboard.html',
})
export class EmployeeDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.EMPLOYEE.filter((item) => item.route !== '/employee/dashboard');

  private readonly dashboardApi = inject(DashboardApi);
  private readonly announcementApi = inject(AnnouncementApi);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<DashboardData | null>(null);

  constructor() {
    forkJoin({
      leaveSummary: this.dashboardApi.leaveSummary().pipe(catchError(() => of(null))),
      announcements: this.announcementApi.list({ page: 1, pageSize: 3 }).pipe(catchError(() => of(null))),
    }).subscribe((result) => {
      this.loading.set(false);

      if (!result.leaveSummary && !result.announcements) {
        this.error.set(extractErrorMessage(null, 'Unable to load dashboard data.'));
        return;
      }

      this.data.set({
        leaveSummary: result.leaveSummary?.data ?? { byStatus: {} as never, byType: {} as never },
        announcements: result.announcements?.data ?? [],
      });
    });
  }

  protected readonly leaveTypeChart = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const summary = this.data()?.leaveSummary;
    if (!summary) return null;
    const entries = Object.entries(summary.byType).filter(([, count]) => count > 0);
    if (entries.length === 0) return null;
    return {
      labels: entries.map(([type]) => type),
      datasets: [{ label: 'My requests', data: entries.map(([, count]) => count), backgroundColor: LEAVE_TYPE_COLORS }],
    };
  });

  protected readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  protected readonly leavePending = computed(() => this.data()?.leaveSummary.byStatus['PENDING'] ?? 0);
  protected readonly leaveApproved = computed(() => this.data()?.leaveSummary.byStatus['APPROVED'] ?? 0);
}

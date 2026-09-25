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
import { AttendanceTrend, EmployeeSummary, LeaveSummary } from '../../../core/models/dashboard.model';
import { Announcement } from '../../../core/models/announcement.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#4caf50',
  INACTIVE: '#9e9e9e',
  ON_LEAVE: '#ff9800',
  TERMINATED: '#f44336',
};

const LEAVE_TYPE_COLORS = ['#3f51b5', '#00bcd4', '#8bc34a', '#ff9800', '#9c27b0'];

interface DashboardData {
  employeeSummary: EmployeeSummary;
  attendanceTrend: AttendanceTrend;
  leaveSummary: LeaveSummary;
  announcements: Announcement[];
}

@Component({
  imports: [DatePipe, BaseChartDirective, DashboardCard, DashboardWidget],
  selector: 'app-manager-dashboard',
  styleUrl: './manager-dashboard.scss',
  templateUrl: './manager-dashboard.html',
})
export class ManagerDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.MANAGER.filter((item) => item.route !== '/manager/dashboard');

  private readonly dashboardApi = inject(DashboardApi);
  private readonly announcementApi = inject(AnnouncementApi);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<DashboardData | null>(null);

  constructor() {
    forkJoin({
      employeeSummary: this.dashboardApi.employeeSummary().pipe(catchError(() => of(null))),
      attendanceTrend: this.dashboardApi.attendanceTrend(14).pipe(catchError(() => of(null))),
      leaveSummary: this.dashboardApi.leaveSummary().pipe(catchError(() => of(null))),
      announcements: this.announcementApi.list({ page: 1, pageSize: 3 }).pipe(catchError(() => of(null))),
    }).subscribe((result) => {
      this.loading.set(false);

      if (!result.employeeSummary && !result.leaveSummary) {
        this.error.set(extractErrorMessage(null, 'Unable to load dashboard data.'));
        return;
      }

      this.data.set({
        employeeSummary: result.employeeSummary?.data ?? { total: 0, byStatus: {} as never, byDepartment: [] },
        attendanceTrend: result.attendanceTrend?.data ?? { labels: [], presentPercent: [] },
        leaveSummary: result.leaveSummary?.data ?? { byStatus: {} as never, byType: {} as never },
        announcements: result.announcements?.data ?? [],
      });
    });
  }

  protected readonly teamStatusChart = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    const summary = this.data()?.employeeSummary;
    if (!summary) return null;
    const entries = Object.entries(summary.byStatus).filter(([, count]) => count > 0);
    if (entries.length === 0) return null;
    return {
      labels: entries.map(([status]) => status.replace('_', ' ')),
      datasets: [{ data: entries.map(([, count]) => count), backgroundColor: entries.map(([status]) => STATUS_COLORS[status] ?? '#607d8b') }],
    };
  });

  protected readonly attendanceChart = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const trend = this.data()?.attendanceTrend;
    if (!trend) return null;
    return {
      labels: trend.labels,
      datasets: [{ label: '% Present', data: trend.presentPercent, borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.15)', fill: true, tension: 0.3 }],
    };
  });

  protected readonly leaveTypeChart = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const summary = this.data()?.leaveSummary;
    if (!summary) return null;
    const entries = Object.entries(summary.byType).filter(([, count]) => count > 0);
    if (entries.length === 0) return null;
    return {
      labels: entries.map(([type]) => type),
      datasets: [{ label: 'Requests', data: entries.map(([, count]) => count), backgroundColor: LEAVE_TYPE_COLORS }],
    };
  });

  protected readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  protected readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  protected readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  protected readonly leavePending = computed(() => this.data()?.leaveSummary.byStatus['PENDING'] ?? 0);
  protected readonly teamSize = computed(() => this.data()?.employeeSummary.total ?? 0);
}

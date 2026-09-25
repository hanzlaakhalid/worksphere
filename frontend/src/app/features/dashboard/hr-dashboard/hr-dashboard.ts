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
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import {
  AttendanceTrend,
  EmployeeGrowth,
  EmployeeSummary,
  LeaveSummary,
  PayrollSummary,
} from '../../../core/models/dashboard.model';
import { RecruitmentStats } from '../../../core/models/recruitment.model';
import { Announcement } from '../../../core/models/announcement.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { SalaryFormatPipe } from '../../../shared/pipes/salary-format-pipe';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#4caf50',
  INACTIVE: '#9e9e9e',
  ON_LEAVE: '#ff9800',
  TERMINATED: '#f44336',
};

const LEAVE_TYPE_COLORS = ['#3f51b5', '#00bcd4', '#8bc34a', '#ff9800', '#9c27b0'];

interface DashboardData {
  employeeSummary: EmployeeSummary;
  employeeGrowth: EmployeeGrowth;
  attendanceTrend: AttendanceTrend;
  leaveSummary: LeaveSummary;
  hiringStats: RecruitmentStats;
  payrollSummary: PayrollSummary;
  announcements: Announcement[];
}

@Component({
  imports: [DatePipe, SalaryFormatPipe, BaseChartDirective, DashboardCard, DashboardWidget],
  selector: 'app-hr-dashboard',
  styleUrl: './hr-dashboard.scss',
  templateUrl: './hr-dashboard.html',
})
export class HrDashboard {
  protected readonly authFacade = inject(AuthFacade);
  protected readonly quickLinks = NAV_ITEMS_BY_ROLE.HR_MANAGER.filter((item) => item.route !== '/hr/dashboard');

  private readonly dashboardApi = inject(DashboardApi);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly announcementApi = inject(AnnouncementApi);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<DashboardData | null>(null);

  constructor() {
    forkJoin({
      employeeSummary: this.dashboardApi.employeeSummary().pipe(catchError(() => of(null))),
      employeeGrowth: this.dashboardApi.employeeGrowth(12).pipe(catchError(() => of(null))),
      attendanceTrend: this.dashboardApi.attendanceTrend(14).pipe(catchError(() => of(null))),
      leaveSummary: this.dashboardApi.leaveSummary().pipe(catchError(() => of(null))),
      hiringStats: this.applicationApi.stats().pipe(catchError(() => of(null))),
      payrollSummary: this.dashboardApi.payrollSummary().pipe(catchError(() => of(null))),
      announcements: this.announcementApi.list({ page: 1, pageSize: 3 }).pipe(catchError(() => of(null))),
    }).subscribe((result) => {
      this.loading.set(false);

      if (!result.employeeSummary && !result.leaveSummary) {
        this.error.set(extractErrorMessage(null, 'Unable to load dashboard data.'));
        return;
      }

      this.data.set({
        employeeSummary: result.employeeSummary?.data ?? { total: 0, byStatus: {} as never, byDepartment: [] },
        employeeGrowth: result.employeeGrowth?.data ?? { labels: [], counts: [] },
        attendanceTrend: result.attendanceTrend?.data ?? { labels: [], presentPercent: [] },
        leaveSummary: result.leaveSummary?.data ?? { byStatus: {} as never, byType: {} as never },
        hiringStats: result.hiringStats?.data ?? { openJobs: 0, totalApplicants: 0, byStatus: {} as never },
        payrollSummary: result.payrollSummary?.data ?? { currentMonthTotal: '0', byDepartment: [] },
        announcements: result.announcements?.data ?? [],
      });
    });
  }

  protected readonly employeeStatusChart = computed<ChartConfiguration<'doughnut'>['data'] | null>(() => {
    const summary = this.data()?.employeeSummary;
    if (!summary) return null;
    const entries = Object.entries(summary.byStatus).filter(([, count]) => count > 0);
    return {
      labels: entries.map(([status]) => status.replace('_', ' ')),
      datasets: [{ data: entries.map(([, count]) => count), backgroundColor: entries.map(([status]) => STATUS_COLORS[status] ?? '#607d8b') }],
    };
  });

  protected readonly departmentChart = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const summary = this.data()?.employeeSummary;
    if (!summary || summary.byDepartment.length === 0) return null;
    return {
      labels: summary.byDepartment.map((d) => d.department),
      datasets: [{ label: 'Employees', data: summary.byDepartment.map((d) => d.count), backgroundColor: '#3f51b5' }],
    };
  });

  protected readonly growthChart = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const growth = this.data()?.employeeGrowth;
    if (!growth) return null;
    return {
      labels: growth.labels,
      datasets: [{ label: 'New hires', data: growth.counts, borderColor: '#3f51b5', backgroundColor: 'rgba(63,81,181,0.15)', fill: true, tension: 0.3 }],
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

  protected readonly payrollChart = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const summary = this.data()?.payrollSummary;
    if (!summary || summary.byDepartment.length === 0) return null;
    return {
      labels: summary.byDepartment.map((d) => d.department),
      datasets: [{ label: 'Net payroll (USD)', data: summary.byDepartment.map((d) => Number(d.total)), backgroundColor: '#009688' }],
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
}

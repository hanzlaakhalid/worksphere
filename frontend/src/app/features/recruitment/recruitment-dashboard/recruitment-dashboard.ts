import { Component, computed, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardCard } from '../../../shared/ui/dashboard-card/dashboard-card';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { ApplicationStatus, RecruitmentStats } from '../../../core/models/recruitment.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: '#9e9e9e',
  SCREENING: '#ff9800',
  INTERVIEW: '#3f51b5',
  SELECTED: '#4caf50',
  REJECTED: '#f44336',
};

const STATUS_ORDER: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

@Component({
  imports: [BaseChartDirective, DashboardCard],
  selector: 'app-recruitment-dashboard',
  styleUrl: './recruitment-dashboard.scss',
  templateUrl: './recruitment-dashboard.html',
})
export class RecruitmentDashboard {
  private readonly applicationApi = inject(ApplicationApi);

  protected readonly loading = signal(true);
  protected readonly stats = signal<RecruitmentStats | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const byStatus = this.stats()?.byStatus;
    return {
      labels: STATUS_ORDER.map((status) => STATUS_LABELS[status]),
      datasets: [
        {
          data: STATUS_ORDER.map((status) => byStatus?.[status] ?? 0),
          backgroundColor: STATUS_ORDER.map((status) => STATUS_COLORS[status]),
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  protected readonly hasApplications = computed(() =>
    Object.values(this.stats()?.byStatus ?? {}).some((count) => count > 0),
  );

  constructor() {
    this.applicationApi
      .stats()
      .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load recruitment stats.') })))
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          return;
        }
        this.stats.set(result.data);
      });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { PerformanceApi } from '../../../core/performance/performance-api';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { PerformanceRating, PerformanceReview } from '../../../core/models/performance.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import {
  PerformanceReviewDialog,
  PerformanceReviewDialogData,
} from '../performance-review-dialog/performance-review-dialog';

const RATING_LABELS: Record<PerformanceRating, string> = {
  OUTSTANDING: 'Outstanding',
  EXCEEDS_EXPECTATIONS: 'Exceeds Expectations',
  MEETS_EXPECTATIONS: 'Meets Expectations',
  NEEDS_IMPROVEMENT: 'Needs Improvement',
  UNSATISFACTORY: 'Unsatisfactory',
};

const RATING_SCORE: Record<PerformanceRating, number> = {
  UNSATISFACTORY: 1,
  NEEDS_IMPROVEMENT: 2,
  MEETS_EXPECTATIONS: 3,
  EXCEEDS_EXPECTATIONS: 4,
  OUTSTANDING: 5,
};

@Component({
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatExpansionModule,
    BaseChartDirective,
    DataTable,
  ],
  selector: 'app-performance-list',
  styleUrl: './performance-list.scss',
  templateUrl: './performance-list.html',
})
export class PerformanceList {
  private readonly performanceApi = inject(PerformanceApi);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** 'self' (employee: read-only history + rating chart) vs 'team' (manager: reviews they wrote + New Review). */
  protected readonly mode = (this.route.snapshot.data['mode'] as 'self' | 'team') ?? 'self';
  protected readonly displayedColumns =
    this.mode === 'team'
      ? ['employee', 'reviewPeriod', 'overallRating', 'createdAt']
      : ['reviewPeriod', 'overallRating', 'createdAt'];

  protected readonly loading = signal(true);
  protected readonly reviews = signal<PerformanceReview[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedId = signal<string | null>(null);

  protected ratingLabel(rating: PerformanceRating): string {
    return RATING_LABELS[rating];
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const sorted = [...this.reviews()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    return {
      labels: sorted.map((r) => r.reviewPeriod),
      datasets: [
        {
          label: 'Overall rating',
          data: sorted.map((r) => RATING_SCORE[r.overallRating]),
          backgroundColor: '#3f51b5',
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) =>
            (['', 'Unsatisfactory', 'Needs Improvement', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'] as const)[
              value as number
            ] ?? '',
        },
      },
    },
    plugins: { legend: { display: false } },
  };

  constructor() {
    this.performanceApi
      .list({ page: 1, pageSize: 50 })
      .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load performance reviews.') })))
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          return;
        }
        this.reviews.set(result.data);
      });
  }

  protected openNewReviewDialog(): void {
    this.employeeApi
      .list({ page: 1, pageSize: 100 })
      .pipe(
        switchMap((res) => {
          const teamOptions = res.data.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
          return this.dialog
            .open<PerformanceReviewDialog, PerformanceReviewDialogData>(PerformanceReviewDialog, {
              data: { teamOptions },
            })
            .afterClosed();
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.reviews.update((current) => [result, ...current]);
        }
      });
  }
}

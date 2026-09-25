import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { JobApi } from '../../../core/recruitment/job-api';
import { EmployeeApi } from '../../../core/employees/employee-api';
import { Application, ApplicationStatus, JobOption } from '../../../core/models/recruitment.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import {
  ApplicationFormDialog,
  ApplicationFormDialogData,
} from '../application-form-dialog/application-form-dialog';
import { InterviewDialog, InterviewDialogData } from '../interview-dialog/interview-dialog';

const STATUS_OPTIONS: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

@Component({
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    DataTable,
  ],
  selector: 'app-application-list',
  styleUrl: './application-list.scss',
  templateUrl: './application-list.html',
})
export class ApplicationList {
  private readonly applicationApi = inject(ApplicationApi);
  private readonly jobApi = inject(JobApi);
  private readonly employeeApi = inject(EmployeeApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  protected readonly displayedColumns = ['applicant', 'job', 'appliedAt', 'status', 'actions'];
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly loading = signal(true);
  protected readonly applications = signal<Application[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly jobOptions = signal<JobOption[]>([]);
  protected readonly expandedId = signal<string | null>(null);

  protected readonly jobFilter = signal<string | null>(this.route.snapshot.queryParamMap.get('jobId'));
  protected readonly statusFilter = signal<ApplicationStatus | null>(null);
  private readonly refreshTrigger = signal(0);

  constructor() {
    this.jobApi.options().subscribe({ next: (res) => this.jobOptions.set(res.data) });

    combineLatest([toObservable(this.jobFilter), toObservable(this.statusFilter), toObservable(this.refreshTrigger)])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([jobId, status]) =>
          this.applicationApi
            .list({ page: 1, pageSize: 100, jobId: jobId ?? undefined, status: status ?? undefined })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load applications.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.applications.set([]);
          return;
        }
        this.applications.set(result.data);
      });
  }

  protected onJobFilterChange(value: string | null): void {
    this.jobFilter.set(value);
  }

  protected onStatusFilterChange(value: ApplicationStatus | null): void {
    this.statusFilter.set(value);
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected changeStatus(application: Application, status: ApplicationStatus): void {
    this.applicationApi.updateStatus(application.id, status).subscribe({
      next: () => this.refreshTrigger.update((n) => n + 1),
      error: (err) => this.error.set(extractErrorMessage(err, 'Unable to update this application.')),
    });
  }

  protected openLogApplicationDialog(): void {
    this.dialog
      .open<ApplicationFormDialog, ApplicationFormDialogData>(ApplicationFormDialog, {
        data: { jobOptions: this.jobOptions(), preselectedJobId: this.jobFilter() },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected scheduleInterview(application: Application, event: Event): void {
    event.stopPropagation();
    this.employeeApi
      .list({ page: 1, pageSize: 100 })
      .pipe(
        switchMap((res) => {
          const employeeOptions = res.data.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));
          return this.dialog
            .open<InterviewDialog, InterviewDialogData>(InterviewDialog, {
              data: { applicationId: application.id, employeeOptions },
            })
            .afterClosed();
        }),
      )
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DataTable } from '../../../shared/ui/data-table/data-table';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { JobApi } from '../../../core/recruitment/job-api';
import { DepartmentApi } from '../../../core/departments/department-api';
import { Job } from '../../../core/models/recruitment.model';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { JobFormDialog, JobFormDialogData } from '../job-form-dialog/job-form-dialog';

const STATUS_VARIANT = {
  OPEN: 'success',
  ON_HOLD: 'warning',
  CLOSED: 'neutral',
} as const;

@Component({
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, DataTable, StatusBadge],
  selector: 'app-job-list',
  styleUrl: './job-list.scss',
  templateUrl: './job-list.html',
})
export class JobList {
  private readonly jobApi = inject(JobApi);
  private readonly departmentApi = inject(DepartmentApi);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['title', 'department', 'location', 'employmentType', 'applicants', 'status', 'actions'];

  protected readonly loading = signal(true);
  protected readonly jobs = signal<Job[]>([]);
  protected readonly departments = signal<Department[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected statusVariant(status: Job['status']) {
    return STATUS_VARIANT[status];
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin([this.jobApi.list({ page: 1, pageSize: 50 }), this.departmentApi.list()])
      .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load jobs.') })))
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          return;
        }
        const [jobsResult, departmentsResult] = result;
        this.jobs.set(jobsResult.data);
        this.departments.set(departmentsResult.data);
      });
  }

  protected viewApplicants(job: Job): void {
    this.router.navigate(['/hr/recruitment/applications'], { queryParams: { jobId: job.id } });
  }

  protected openCreateDialog(): void {
    this.openDialog(null);
  }

  protected openEditDialog(job: Job, event: Event): void {
    event.stopPropagation();
    this.openDialog(job);
  }

  private openDialog(job: Job | null): void {
    this.dialog
      .open<JobFormDialog, JobFormDialogData>(JobFormDialog, { data: { job, departments: this.departments() } })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.load();
        }
      });
  }

  protected deleteJob(job: Job, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete job',
          message: `Delete "${job.title}"? Its applications will be removed too. This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.jobApi.delete(job.id).subscribe({
          next: () => this.load(),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this job.')),
        });
      });
  }
}

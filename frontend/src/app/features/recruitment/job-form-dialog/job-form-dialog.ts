import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JobApi } from '../../../core/recruitment/job-api';
import { Job, JobStatus } from '../../../core/models/recruitment.model';
import { EmploymentType } from '../../../core/models/employee.model';
import { Department } from '../../../core/models/department.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const STATUSES: JobStatus[] = ['OPEN', 'ON_HOLD', 'CLOSED'];

export interface JobFormDialogData {
  job: Job | null;
  departments: Department[];
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    Modal,
  ],
  selector: 'app-job-form-dialog',
  styleUrl: './job-form-dialog.scss',
  templateUrl: './job-form-dialog.html',
})
export class JobFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly jobApi = inject(JobApi);
  private readonly dialogRef = inject(MatDialogRef<JobFormDialog>);
  protected readonly data = inject<JobFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.job;
  protected readonly employmentTypes = EMPLOYMENT_TYPES;
  protected readonly statuses = STATUSES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: this.fb.nonNullable.control(this.data.job?.title ?? '', [Validators.required, Validators.maxLength(150)]),
    departmentId: this.fb.control<string | null>(this.data.job?.department?.id ?? null),
    description: this.fb.nonNullable.control(this.data.job?.description ?? '', [
      Validators.required,
      Validators.minLength(10),
    ]),
    requirements: this.fb.nonNullable.control(this.data.job?.requirements ?? '', [
      Validators.required,
      Validators.minLength(10),
    ]),
    location: this.fb.nonNullable.control(this.data.job?.location ?? '', Validators.required),
    employmentType: this.fb.nonNullable.control<EmploymentType>(this.data.job?.employmentType ?? 'FULL_TIME', Validators.required),
    salaryRangeMin: this.fb.control<number | null>(this.data.job?.salaryRangeMin ? Number(this.data.job.salaryRangeMin) : null),
    salaryRangeMax: this.fb.control<number | null>(this.data.job?.salaryRangeMax ? Number(this.data.job.salaryRangeMax) : null),
    status: this.fb.nonNullable.control<JobStatus>(this.data.job?.status ?? 'OPEN', Validators.required),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();

    const request$ = this.isEditMode && this.data.job ? this.jobApi.update(this.data.job.id, value) : this.jobApi.create(value);

    request$.subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this job.'));
      },
    });
  }
}

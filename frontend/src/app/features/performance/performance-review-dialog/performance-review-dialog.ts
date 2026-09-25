import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformanceApi } from '../../../core/performance/performance-api';
import { PerformanceRating } from '../../../core/models/performance.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

const RATINGS: PerformanceRating[] = [
  'OUTSTANDING',
  'EXCEEDS_EXPECTATIONS',
  'MEETS_EXPECTATIONS',
  'NEEDS_IMPROVEMENT',
  'UNSATISFACTORY',
];

export interface PerformanceReviewDialogData {
  teamOptions: EmployeeOption[];
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
  selector: 'app-performance-review-dialog',
  styleUrl: './performance-review-dialog.scss',
  templateUrl: './performance-review-dialog.html',
})
export class PerformanceReviewDialog {
  private readonly fb = inject(FormBuilder);
  private readonly performanceApi = inject(PerformanceApi);
  private readonly dialogRef = inject(MatDialogRef<PerformanceReviewDialog>);
  protected readonly data = inject<PerformanceReviewDialogData>(MAT_DIALOG_DATA);

  protected readonly ratings = RATINGS;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    reviewPeriod: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    overallRating: this.fb.nonNullable.control<PerformanceRating>('MEETS_EXPECTATIONS', Validators.required),
    goals: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    achievements: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    strengths: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    areasForImprovement: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    managerComments: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.performanceApi.create(this.form.getRawValue()).subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this review.'));
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

export interface InterviewDialogData {
  applicationId: string;
  employeeOptions: EmployeeOption[];
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    Modal,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-interview-dialog',
  styleUrl: './interview-dialog.scss',
  templateUrl: './interview-dialog.html',
})
export class InterviewDialog {
  private readonly fb = inject(FormBuilder);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly dialogRef = inject(MatDialogRef<InterviewDialog>);
  protected readonly data = inject<InterviewDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    scheduledAt: this.fb.control<Date | null>(null, Validators.required),
    interviewerId: this.fb.control<string | null>(null),
    notes: this.fb.nonNullable.control(''),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    this.applicationApi
      .addInterview(this.data.applicationId, {
        scheduledAt: raw.scheduledAt!.toISOString(),
        interviewerId: raw.interviewerId,
        notes: raw.notes || null,
      })
      .subscribe({
        next: ({ data }) => {
          this.saving.set(false);
          this.dialogRef.close(data);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(extractErrorMessage(err, 'Unable to schedule this interview.'));
        },
      });
  }
}

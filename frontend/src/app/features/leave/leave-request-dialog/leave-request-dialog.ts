import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeaveApi } from '../../../core/leaves/leave-api';
import { LeaveType } from '../../../core/models/leave.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';
import { FileUpload } from '../../../shared/ui/file-upload/file-upload';

const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'UNPAID'];

function endNotBeforeStartValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value as Date | null;
    const end = group.get('endDate')?.value as Date | null;
    const endControl = group.get('endDate');
    if (!endControl) return null;

    if (start && end && end.getTime() < start.getTime()) {
      endControl.setErrors({ ...endControl.errors, endBeforeStart: true });
    } else if (endControl.errors) {
      const { endBeforeStart: _removed, ...rest } = endControl.errors;
      endControl.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
    return null;
  };
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
    FileUpload,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-leave-request-dialog',
  styleUrl: './leave-request-dialog.scss',
  templateUrl: './leave-request-dialog.html',
})
export class LeaveRequestDialog {
  private readonly fb = inject(FormBuilder);
  private readonly leaveApi = inject(LeaveApi);
  private readonly dialogRef = inject(MatDialogRef<LeaveRequestDialog>);

  protected readonly leaveTypes = LEAVE_TYPES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      leaveType: this.fb.nonNullable.control<LeaveType>('ANNUAL', Validators.required),
      startDate: this.fb.control<Date | null>(null, Validators.required),
      endDate: this.fb.control<Date | null>(null, Validators.required),
      reason: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]),
      attachmentUrl: this.fb.control<string | null>(null),
    },
    { validators: endNotBeforeStartValidator() },
  );

  protected onAttachmentUploaded(url: string): void {
    this.form.controls.attachmentUrl.setValue(url);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    this.leaveApi
      .create({
        leaveType: raw.leaveType,
        startDate: raw.startDate!.toISOString(),
        endDate: raw.endDate!.toISOString(),
        reason: raw.reason,
        attachmentUrl: raw.attachmentUrl,
      })
      .subscribe({
        next: ({ data }) => {
          this.saving.set(false);
          this.dialogRef.close(data);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(extractErrorMessage(err, 'Unable to submit this leave request.'));
        },
      });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationApi } from '../../../core/recruitment/application-api';
import { JobOption } from '../../../core/models/recruitment.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';
import { FileUpload } from '../../../shared/ui/file-upload/file-upload';

export interface ApplicationFormDialogData {
  jobOptions: JobOption[];
  preselectedJobId: string | null;
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
    FileUpload,
  ],
  selector: 'app-application-form-dialog',
  styleUrl: './application-form-dialog.scss',
  templateUrl: './application-form-dialog.html',
})
export class ApplicationFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly applicationApi = inject(ApplicationApi);
  private readonly dialogRef = inject(MatDialogRef<ApplicationFormDialog>);
  protected readonly data = inject<ApplicationFormDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    jobId: this.fb.nonNullable.control(this.data.preselectedJobId ?? '', Validators.required),
    firstName: this.fb.nonNullable.control('', Validators.required),
    lastName: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    phone: this.fb.nonNullable.control(''),
    resumeUrl: this.fb.control<string | null>(null),
  });

  protected onResumeUploaded(url: string): void {
    this.form.controls.resumeUrl.setValue(url);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.applicationApi.create(this.form.getRawValue()).subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this application.'));
      },
    });
  }
}

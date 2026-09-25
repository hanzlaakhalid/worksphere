import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DocumentApi } from '../../../core/documents/document-api';
import { DocumentCategory } from '../../../core/models/document.model';
import { EmployeeOption } from '../../../core/models/employee.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';
import { FileUpload } from '../../../shared/ui/file-upload/file-upload';

const CATEGORIES: DocumentCategory[] = ['POLICY', 'CONTRACT', 'CERTIFICATE', 'ID_PROOF', 'OTHER'];

export interface DocumentUploadDialogData {
  canTargetEmployee: boolean;
  employeeOptions: EmployeeOption[];
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
  selector: 'app-document-upload-dialog',
  styleUrl: './document-upload-dialog.scss',
  templateUrl: './document-upload-dialog.html',
})
export class DocumentUploadDialog {
  private readonly fb = inject(FormBuilder);
  private readonly documentApi = inject(DocumentApi);
  private readonly dialogRef = inject(MatDialogRef<DocumentUploadDialog>);
  protected readonly data = inject<DocumentUploadDialogData>(MAT_DIALOG_DATA);

  protected readonly categories = CATEGORIES;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    category: this.fb.nonNullable.control<DocumentCategory>('OTHER', Validators.required),
    fileUrl: this.fb.nonNullable.control('', Validators.required),
    employeeId: this.fb.control<string | null>(null),
  });

  protected onFileUploaded(url: string): void {
    this.form.controls.fileUrl.setValue(url);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();

    this.documentApi
      .create({ title: raw.title, category: raw.category, fileUrl: raw.fileUrl, employeeId: raw.employeeId })
      .subscribe({
        next: ({ data }) => {
          this.saving.set(false);
          this.dialogRef.close(data);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(extractErrorMessage(err, 'Unable to upload this document.'));
        },
      });
  }
}

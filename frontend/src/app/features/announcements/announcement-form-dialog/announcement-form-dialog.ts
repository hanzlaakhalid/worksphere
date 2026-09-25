import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { Announcement } from '../../../core/models/announcement.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { Modal } from '../../../shared/ui/modal/modal';

export interface AnnouncementFormDialogData {
  announcement: Announcement | null;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Modal,
  ],
  providers: [provideNativeDateAdapter()],
  selector: 'app-announcement-form-dialog',
  styleUrl: './announcement-form-dialog.scss',
  templateUrl: './announcement-form-dialog.html',
})
export class AnnouncementFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly announcementApi = inject(AnnouncementApi);
  private readonly dialogRef = inject(MatDialogRef<AnnouncementFormDialog>);
  protected readonly data = inject<AnnouncementFormDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = !!this.data.announcement;
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: this.fb.nonNullable.control(this.data.announcement?.title ?? '', [Validators.required, Validators.maxLength(150)]),
    content: this.fb.nonNullable.control(this.data.announcement?.content ?? '', [Validators.required, Validators.maxLength(5000)]),
    publishedAt: this.fb.nonNullable.control<Date>(
      this.data.announcement ? new Date(this.data.announcement.publishedAt) : new Date(),
      Validators.required,
    ),
    expiresAt: this.fb.control<Date | null>(
      this.data.announcement?.expiresAt ? new Date(this.data.announcement.expiresAt) : null,
    ),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const raw = this.form.getRawValue();
    const value = {
      title: raw.title,
      content: raw.content,
      publishedAt: raw.publishedAt.toISOString(),
      expiresAt: raw.expiresAt ? raw.expiresAt.toISOString() : null,
    };

    const request$ =
      this.isEditMode && this.data.announcement
        ? this.announcementApi.update(this.data.announcement.id, value)
        : this.announcementApi.create(value);

    request$.subscribe({
      next: ({ data }) => {
        this.saving.set(false);
        this.dialogRef.close(data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractErrorMessage(err, 'Unable to save this announcement.'));
      },
    });
  }
}

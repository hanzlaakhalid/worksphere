import { Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UploadApi } from '../../../core/uploads/upload-api';
import { resolveFileUrl } from '../../../core/utils/file-url.util';

@Component({
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  selector: 'app-file-upload',
  styleUrl: './file-upload.scss',
  templateUrl: './file-upload.html',
})
export class FileUpload {
  private readonly uploadApi = inject(UploadApi);

  readonly accept = input('image/png,image/jpeg,image/webp,image/gif');
  readonly currentUrl = input<string | null>(null);
  readonly label = input('Upload photo');

  readonly uploaded = output<string>();

  protected readonly uploading = signal(false);
  protected readonly progress = signal(0);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly resolvedCurrentUrl = computed(() => resolveFileUrl(this.currentUrl()));

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    this.error.set(null);
    this.previewUrl.set(URL.createObjectURL(file));
    this.uploading.set(true);
    this.progress.set(0);

    this.uploadApi.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploading.set(false);
          this.uploaded.emit(event.body.url);
        }
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('Upload failed. Please try a different file.');
      },
    });
  }
}

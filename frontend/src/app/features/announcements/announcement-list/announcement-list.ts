import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { AnnouncementApi } from '../../../core/announcements/announcement-api';
import { Announcement } from '../../../core/models/announcement.model';
import { extractErrorMessage } from '../../../core/utils/http-error.util';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { AnnouncementFormDialog, AnnouncementFormDialogData } from '../announcement-form-dialog/announcement-form-dialog';

@Component({
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, Pagination, EmptyState],
  selector: 'app-announcement-list',
  styleUrl: './announcement-list.scss',
  templateUrl: './announcement-list.html',
})
export class AnnouncementList {
  private readonly announcementApi = inject(AnnouncementApi);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  /** 'manage' (HR/Admin: every announcement incl. future/expired, create/edit/delete) vs 'view' (everyone else: the active feed). */
  protected readonly mode = (this.route.snapshot.data['mode'] as 'view' | 'manage') ?? 'view';

  protected readonly loading = signal(true);
  protected readonly announcements = signal<Announcement[]>([]);
  protected readonly total = signal(0);
  protected readonly error = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  private readonly refreshTrigger = signal(0);

  constructor() {
    combineLatest([toObservable(this.page), toObservable(this.pageSize), toObservable(this.refreshTrigger)])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([page, pageSize]) =>
          this.announcementApi
            .list({ page, pageSize })
            .pipe(catchError((err) => of({ error: extractErrorMessage(err, 'Unable to load announcements.') }))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.announcements.set([]);
          this.total.set(0);
          return;
        }
        this.announcements.set(result.data);
        this.total.set(result.total);
      });
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
  }

  protected openNewDialog(): void {
    this.dialog
      .open<AnnouncementFormDialog, AnnouncementFormDialogData>(AnnouncementFormDialog, { data: { announcement: null } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected openEditDialog(announcement: Announcement): void {
    this.dialog
      .open<AnnouncementFormDialog, AnnouncementFormDialogData>(AnnouncementFormDialog, { data: { announcement } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refreshTrigger.update((n) => n + 1);
      });
  }

  protected deleteAnnouncement(announcement: Announcement): void {
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Delete Announcement',
          message: `Delete "${announcement.title}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;
        this.announcementApi.delete(announcement.id).subscribe({
          next: () => this.refreshTrigger.update((n) => n + 1),
          error: (err) => this.error.set(extractErrorMessage(err, 'Unable to delete this announcement.')),
        });
      });
  }
}

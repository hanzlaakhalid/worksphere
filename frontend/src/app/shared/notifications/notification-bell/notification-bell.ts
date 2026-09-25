import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { NotificationApi } from '../../../core/notifications/notification-api';
import { AppNotification } from '../../../core/models/notification.model';

const POLL_INTERVAL_MS = 30000;

@Component({
  imports: [DatePipe, MatMenuModule, MatIconModule, MatButtonModule, MatBadgeModule],
  selector: 'app-notification-bell',
  styleUrl: './notification-bell.scss',
  templateUrl: './notification-bell.html',
})
export class NotificationBell {
  private readonly notificationApi = inject(NotificationApi);
  private readonly router = inject(Router);

  protected readonly unreadCount = signal(0);
  protected readonly notifications = signal<AppNotification[]>([]);
  protected readonly loading = signal(false);
  protected readonly panelOpened = signal(false);

  constructor() {
    interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationApi.unreadCount()),
        takeUntilDestroyed(),
      )
      .subscribe((res) => this.unreadCount.set(res.data.count));
  }

  protected onPanelOpened(): void {
    this.panelOpened.set(true);
    this.loading.set(true);
    this.notificationApi.list({ page: 1, pageSize: 10 }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notifications.set(res.data);
      },
      error: () => this.loading.set(false),
    });
  }

  protected selectNotification(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationApi.markRead(notification.id).subscribe(() => {
        this.unreadCount.update((n) => Math.max(0, n - 1));
        this.notifications.update((list) =>
          list.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
        );
      });
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  protected markAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationApi.markAllRead().subscribe(() => {
      this.unreadCount.set(0);
      this.notifications.update((list) => list.map((item) => ({ ...item, isRead: true })));
    });
  }
}

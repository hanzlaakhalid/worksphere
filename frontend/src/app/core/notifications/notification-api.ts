import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models/notification.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class NotificationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  list(query: { page: number; pageSize: number; unreadOnly?: boolean }): Observable<PaginatedResult<AppNotification>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.unreadOnly) params = params.set('unreadOnly', 'true');
    return this.http.get<PaginatedResult<AppNotification>>(this.baseUrl, { params });
  }

  unreadCount(): Observable<{ data: { count: number } }> {
    return this.http.get<{ data: { count: number } }>(`${this.baseUrl}/unread-count`);
  }

  markRead(id: string): Observable<{ data: AppNotification }> {
    return this.http.patch<{ data: AppNotification }>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }
}

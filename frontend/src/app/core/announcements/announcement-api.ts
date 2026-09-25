import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Announcement, AnnouncementFormValue } from '../models/announcement.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class AnnouncementApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/announcements`;

  list(query: { page: number; pageSize: number }): Observable<PaginatedResult<Announcement>> {
    const params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    return this.http.get<PaginatedResult<Announcement>>(this.baseUrl, { params });
  }

  create(value: AnnouncementFormValue): Observable<{ data: Announcement }> {
    return this.http.post<{ data: Announcement }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<AnnouncementFormValue>): Observable<{ data: Announcement }> {
    return this.http.put<{ data: Announcement }>(`${this.baseUrl}/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

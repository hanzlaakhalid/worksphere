import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Job, JobFormValue, JobOption, JobStatus } from '../models/recruitment.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class JobApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/jobs`;

  list(query: { page: number; pageSize: number; status?: JobStatus }): Observable<PaginatedResult<Job>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<PaginatedResult<Job>>(this.baseUrl, { params });
  }

  options(): Observable<{ data: JobOption[] }> {
    return this.http.get<{ data: JobOption[] }>(`${this.baseUrl}/options`);
  }

  getById(id: string): Observable<{ data: Job }> {
    return this.http.get<{ data: Job }>(`${this.baseUrl}/${id}`);
  }

  create(value: JobFormValue): Observable<{ data: Job }> {
    return this.http.post<{ data: Job }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<JobFormValue>): Observable<{ data: Job }> {
    return this.http.put<{ data: Job }>(`${this.baseUrl}/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

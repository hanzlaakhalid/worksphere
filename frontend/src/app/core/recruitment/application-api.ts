import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Application,
  ApplicationFormValue,
  ApplicationStatus,
  InterviewFormValue,
  RecruitmentStats,
} from '../models/recruitment.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class ApplicationApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/applications`;

  list(query: {
    page: number;
    pageSize: number;
    jobId?: string;
    status?: ApplicationStatus;
  }): Observable<PaginatedResult<Application>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.jobId) params = params.set('jobId', query.jobId);
    if (query.status) params = params.set('status', query.status);
    return this.http.get<PaginatedResult<Application>>(this.baseUrl, { params });
  }

  stats(): Observable<{ data: RecruitmentStats }> {
    return this.http.get<{ data: RecruitmentStats }>(`${this.baseUrl}/stats`);
  }

  create(value: ApplicationFormValue): Observable<{ data: Application }> {
    return this.http.post<{ data: Application }>(this.baseUrl, value);
  }

  updateStatus(id: string, status: ApplicationStatus): Observable<{ data: Application }> {
    return this.http.patch<{ data: Application }>(`${this.baseUrl}/${id}/status`, { status });
  }

  addInterview(id: string, value: InterviewFormValue): Observable<{ data: Application }> {
    return this.http.post<{ data: Application }>(`${this.baseUrl}/${id}/interviews`, value);
  }
}

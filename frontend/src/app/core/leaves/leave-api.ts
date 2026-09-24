import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LeaveFormValue, LeaveListQuery, LeaveRequest } from '../models/leave.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class LeaveApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leaves`;

  list(query: LeaveListQuery): Observable<PaginatedResult<LeaveRequest>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.status) params = params.set('status', query.status);
    if (query.leaveType) params = params.set('leaveType', query.leaveType);

    return this.http.get<PaginatedResult<LeaveRequest>>(this.baseUrl, { params });
  }

  create(value: LeaveFormValue): Observable<{ data: LeaveRequest }> {
    return this.http.post<{ data: LeaveRequest }>(this.baseUrl, value);
  }

  approve(id: string): Observable<{ data: LeaveRequest }> {
    return this.http.patch<{ data: LeaveRequest }>(`${this.baseUrl}/${id}/approve`, {});
  }

  reject(id: string, reviewNote: string): Observable<{ data: LeaveRequest }> {
    return this.http.patch<{ data: LeaveRequest }>(`${this.baseUrl}/${id}/reject`, { reviewNote });
  }
}

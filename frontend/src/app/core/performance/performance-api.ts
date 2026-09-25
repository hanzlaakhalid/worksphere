import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerformanceFormValue, PerformanceListQuery, PerformanceReview } from '../models/performance.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class PerformanceApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/performance`;

  list(query: PerformanceListQuery): Observable<PaginatedResult<PerformanceReview>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.employeeId) params = params.set('employeeId', query.employeeId);
    return this.http.get<PaginatedResult<PerformanceReview>>(this.baseUrl, { params });
  }

  create(value: PerformanceFormValue): Observable<{ data: PerformanceReview }> {
    return this.http.post<{ data: PerformanceReview }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<PerformanceFormValue>): Observable<{ data: PerformanceReview }> {
    return this.http.put<{ data: PerformanceReview }>(`${this.baseUrl}/${id}`, value);
  }
}

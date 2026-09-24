import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attendance, AttendanceListQuery, AttendanceStats } from '../models/attendance.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class AttendanceApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/attendance`;

  list(query: AttendanceListQuery): Observable<PaginatedResult<Attendance>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.employeeId) params = params.set('employeeId', query.employeeId);
    if (query.department) params = params.set('department', query.department);
    if (query.status) params = params.set('status', query.status);
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);

    return this.http.get<PaginatedResult<Attendance>>(this.baseUrl, { params });
  }

  statsToday(): Observable<{ data: AttendanceStats }> {
    return this.http.get<{ data: AttendanceStats }>(`${this.baseUrl}/stats/today`);
  }
}

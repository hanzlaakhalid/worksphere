import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceTrend, EmployeeGrowth, EmployeeSummary, LeaveSummary, PayrollSummary } from '../models/dashboard.model';

@Service()
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  employeeSummary(): Observable<{ data: EmployeeSummary }> {
    return this.http.get<{ data: EmployeeSummary }>(`${this.baseUrl}/employee-summary`);
  }

  employeeGrowth(months = 12): Observable<{ data: EmployeeGrowth }> {
    const params = new HttpParams().set('months', months);
    return this.http.get<{ data: EmployeeGrowth }>(`${this.baseUrl}/employee-growth`, { params });
  }

  leaveSummary(): Observable<{ data: LeaveSummary }> {
    return this.http.get<{ data: LeaveSummary }>(`${this.baseUrl}/leave-summary`);
  }

  attendanceTrend(days = 14): Observable<{ data: AttendanceTrend }> {
    const params = new HttpParams().set('days', days);
    return this.http.get<{ data: AttendanceTrend }>(`${this.baseUrl}/attendance-trend`, { params });
  }

  payrollSummary(): Observable<{ data: PayrollSummary }> {
    return this.http.get<{ data: PayrollSummary }>(`${this.baseUrl}/payroll-summary`);
  }
}

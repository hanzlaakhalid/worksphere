import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payroll, PayrollFormValue, PayrollListQuery } from '../models/payroll.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class PayrollApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payroll`;

  list(query: PayrollListQuery): Observable<PaginatedResult<Payroll>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.employeeId) params = params.set('employeeId', query.employeeId);
    if (query.paymentStatus) params = params.set('paymentStatus', query.paymentStatus);
    return this.http.get<PaginatedResult<Payroll>>(this.baseUrl, { params });
  }

  create(value: PayrollFormValue): Observable<{ data: Payroll }> {
    return this.http.post<{ data: Payroll }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<PayrollFormValue>): Observable<{ data: Payroll }> {
    return this.http.put<{ data: Payroll }>(`${this.baseUrl}/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

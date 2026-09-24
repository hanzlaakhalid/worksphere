import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee, EmployeeFormValue, EmployeeListQuery, EmployeeOption } from '../models/employee.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class EmployeeApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/employees`;

  list(query: EmployeeListQuery): Observable<PaginatedResult<Employee>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.search) params = params.set('search', query.search);
    if (query.department) params = params.set('department', query.department);
    if (query.status) params = params.set('status', query.status);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);

    return this.http.get<PaginatedResult<Employee>>(this.baseUrl, { params });
  }

  options(): Observable<{ data: EmployeeOption[] }> {
    return this.http.get<{ data: EmployeeOption[] }>(`${this.baseUrl}/options`);
  }

  getById(id: string): Observable<{ data: Employee }> {
    return this.http.get<{ data: Employee }>(`${this.baseUrl}/${id}`);
  }

  create(value: EmployeeFormValue): Observable<{ data: Employee }> {
    return this.http.post<{ data: Employee }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<EmployeeFormValue>): Observable<{ data: Employee }> {
    return this.http.put<{ data: Employee }>(`${this.baseUrl}/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department, DepartmentFormValue } from '../models/department.model';

@Service()
export class DepartmentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/departments`;

  list(): Observable<{ data: Department[] }> {
    return this.http.get<{ data: Department[] }>(this.baseUrl);
  }

  getById(id: string): Observable<{ data: Department }> {
    return this.http.get<{ data: Department }>(`${this.baseUrl}/${id}`);
  }

  create(value: DepartmentFormValue): Observable<{ data: Department }> {
    return this.http.post<{ data: Department }>(this.baseUrl, value);
  }

  update(id: string, value: Partial<DepartmentFormValue>): Observable<{ data: Department }> {
    return this.http.put<{ data: Department }>(`${this.baseUrl}/${id}`, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentFormValue, DocumentListQuery, WorkDocument } from '../models/document.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Service()
export class DocumentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/documents`;

  list(query: DocumentListQuery): Observable<PaginatedResult<WorkDocument>> {
    let params = new HttpParams().set('page', query.page).set('pageSize', query.pageSize);
    if (query.category) params = params.set('category', query.category);
    if (query.employeeId) params = params.set('employeeId', query.employeeId);
    return this.http.get<PaginatedResult<WorkDocument>>(this.baseUrl, { params });
  }

  create(value: DocumentFormValue): Observable<{ data: WorkDocument }> {
    return this.http.post<{ data: WorkDocument }>(this.baseUrl, value);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

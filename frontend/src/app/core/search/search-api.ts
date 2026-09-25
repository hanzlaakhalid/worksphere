import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SearchResults } from '../models/search.model';

@Service()
export class SearchApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/search`;

  search(q: string): Observable<{ data: SearchResults }> {
    const params = new HttpParams().set('q', q);
    return this.http.get<{ data: SearchResults }>(this.baseUrl, { params });
  }
}

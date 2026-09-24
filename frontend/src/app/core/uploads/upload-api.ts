import { Service, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
}

@Service()
export class UploadApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/uploads`;

  upload(file: File): Observable<HttpEvent<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const request = new HttpRequest('POST', this.baseUrl, formData, {
      reportProgress: true,
    });

    return this.http.request<UploadResponse>(request);
  }
}

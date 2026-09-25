import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { JobApi } from './job-api';
import { environment } from '../../../environments/environment';

describe('JobApi', () => {
  let service: JobApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/jobs`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(JobApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists jobs with an optional status filter', () => {
    service.list({ page: 1, pageSize: 20, status: 'OPEN' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('status') === 'OPEN');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('creates a job', () => {
    const value = { title: 'Engineer' } as never;
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('deletes a job by id', () => {
    service.delete('job-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/job-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

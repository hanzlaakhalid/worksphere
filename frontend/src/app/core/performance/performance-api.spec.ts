import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PerformanceApi } from './performance-api';
import { environment } from '../../../environments/environment';

describe('PerformanceApi', () => {
  let service: PerformanceApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/performance`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PerformanceApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists reviews', () => {
    service.list({ page: 1, pageSize: 20 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('creates a review', () => {
    const value = { employeeId: 'emp-1', reviewPeriod: 'Q1 2026' } as never;
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(value);
    req.flush({ data: {} });
  });

  it('updates a review by id', () => {
    service.update('rev-1', { overallRating: 'OUTSTANDING' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/rev-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });
});

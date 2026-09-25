import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationApi } from './application-api';
import { environment } from '../../../environments/environment';

describe('ApplicationApi', () => {
  let service: ApplicationApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/applications`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ApplicationApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('fetches recruitment stats', () => {
    service.stats().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { openJobs: 1, totalApplicants: 1, byStatus: {} } });
  });

  it('updates application status', () => {
    service.updateStatus('app-1', 'SCREENING').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/app-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'SCREENING' });
    req.flush({ data: {} });
  });

  it('adds an interview', () => {
    const value = { scheduledAt: '2026-10-01', interviewerId: null, notes: null };
    service.addInterview('app-1', value).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/app-1/interviews`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(value);
    req.flush({ data: {} });
  });
});

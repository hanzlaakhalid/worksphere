import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardApi } from './dashboard-api';
import { environment } from '../../../environments/environment';

describe('DashboardApi', () => {
  let service: DashboardApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('fetches employee summary', () => {
    service.employeeSummary().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/employee-summary`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { total: 0, byStatus: {}, byDepartment: [] } });
  });

  it('fetches employee growth with a months param', () => {
    service.employeeGrowth(6).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/employee-growth` && r.params.get('months') === '6');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { labels: [], counts: [] } });
  });

  it('fetches leave summary', () => {
    service.leaveSummary().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/leave-summary`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { byStatus: {}, byType: {} } });
  });

  it('fetches attendance trend with a days param', () => {
    service.attendanceTrend(7).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${baseUrl}/attendance-trend` && r.params.get('days') === '7');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { labels: [], presentPercent: [] } });
  });

  it('fetches payroll summary', () => {
    service.payrollSummary().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/payroll-summary`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { currentMonthTotal: '0', byDepartment: [] } });
  });
});

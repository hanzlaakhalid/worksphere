import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LeaveApi } from './leave-api';
import { environment } from '../../../environments/environment';

describe('LeaveApi', () => {
  let service: LeaveApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/leaves`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LeaveApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists leave requests with the provided filters', () => {
    service.list({ page: 1, pageSize: 20, status: 'PENDING' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('status') === 'PENDING');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('submits a new leave request', () => {
    const value = { leaveType: 'ANNUAL', startDate: '2026-10-01', endDate: '2026-10-02', reason: 'Trip', attachmentUrl: null };
    service.create(value as never).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(value);
    req.flush({ data: {} });
  });

  it('approves a leave request', () => {
    service.approve('leave-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/leave-1/approve`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('rejects a leave request with a reason', () => {
    service.reject('leave-1', 'Not enough coverage that week').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/leave-1/reject`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ reviewNote: 'Not enough coverage that week' });
    req.flush({ data: {} });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AttendanceApi } from './attendance-api';
import { environment } from '../../../environments/environment';

describe('AttendanceApi', () => {
  let service: AttendanceApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/attendance`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttendanceApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests the list with only the provided filters', () => {
    service.list({ page: 1, pageSize: 20, status: 'LATE', dateFrom: '2026-09-01' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('status') === 'LATE' &&
        r.params.get('dateFrom') === '2026-09-01' &&
        !r.params.has('department'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it("fetches today's stats", () => {
    service.statsToday().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/stats/today`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { present: 1, absent: 0, late: 0, halfDay: 0, onLeave: 0 } });
  });
});

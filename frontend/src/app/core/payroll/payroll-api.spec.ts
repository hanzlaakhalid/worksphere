import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PayrollApi } from './payroll-api';
import { environment } from '../../../environments/environment';

describe('PayrollApi', () => {
  let service: PayrollApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/payroll`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PayrollApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists payroll records with filters', () => {
    service.list({ page: 1, pageSize: 20, paymentStatus: 'PAID' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('paymentStatus') === 'PAID');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('creates a payroll record', () => {
    const value = { employeeId: 'emp-1' } as never;
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('deletes a payroll record by id', () => {
    service.delete('pay-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/pay-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

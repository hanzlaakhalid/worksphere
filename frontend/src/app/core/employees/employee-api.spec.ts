import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EmployeeApi } from './employee-api';
import { environment } from '../../../environments/environment';

describe('EmployeeApi', () => {
  let service: EmployeeApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/employees`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmployeeApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests the paginated list with only the provided query params', () => {
    service.list({ page: 2, pageSize: 10 }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('page') === '2' && r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('search')).toBe(false);
    req.flush({ data: [], page: 2, pageSize: 10, total: 0 });
  });

  it('includes search, department, status, and sort params when given', () => {
    service
      .list({
        page: 1,
        pageSize: 20,
        search: 'silva',
        department: 'dept-1',
        status: 'ACTIVE',
        sortBy: 'lastName',
        sortOrder: 'desc',
      })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('search') === 'silva' &&
        r.params.get('department') === 'dept-1' &&
        r.params.get('status') === 'ACTIVE' &&
        r.params.get('sortBy') === 'lastName' &&
        r.params.get('sortOrder') === 'desc',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('fetches a single employee by id', () => {
    service.getById('emp-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/emp-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: {} });
  });

  it('posts a new employee', () => {
    const value = { firstName: 'Nina', lastName: 'Petrov' } as never;
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(value);
    req.flush({ data: {} });
  });

  it('updates an employee by id', () => {
    service.update('emp-1', { status: 'INACTIVE' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/emp-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'INACTIVE' });
    req.flush({ data: {} });
  });

  it('deletes an employee by id', () => {
    service.delete('emp-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/emp-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('propagates an error response to the caller', () => {
    let capturedError: unknown;
    service.list({ page: 1, pageSize: 20 }).subscribe({ error: (err) => (capturedError = err) });

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    req.flush({ error: { message: 'Forbidden' } }, { status: 403, statusText: 'Forbidden' });

    expect(capturedError).toBeTruthy();
  });
});

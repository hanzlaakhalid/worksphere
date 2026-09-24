import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DepartmentApi } from './department-api';
import { environment } from '../../../environments/environment';

describe('DepartmentApi', () => {
  let service: DepartmentApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/departments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DepartmentApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists departments', () => {
    service.list().subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('creates a department', () => {
    const value = { name: 'Operations', description: '', managerId: null };
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(value);
    req.flush({ data: {} });
  });

  it('deletes a department by id', () => {
    service.delete('dept-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/dept-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DocumentApi } from './document-api';
import { environment } from '../../../environments/environment';

describe('DocumentApi', () => {
  let service: DocumentApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/documents`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DocumentApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists documents with optional category and employeeId filters', () => {
    service.list({ page: 1, pageSize: 20, category: 'POLICY', employeeId: 'emp-1' }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === baseUrl && r.params.get('category') === 'POLICY' && r.params.get('employeeId') === 'emp-1',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('creates a document', () => {
    const value = { title: 'Handbook', category: 'POLICY', fileUrl: '/uploads/a.pdf' } as never;
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('deletes a document by id', () => {
    service.delete('doc-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/doc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

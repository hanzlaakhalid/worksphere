import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SearchApi } from './search-api';
import { environment } from '../../../environments/environment';

describe('SearchApi', () => {
  let service: SearchApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/search`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SearchApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searches with the query string as a param', () => {
    service.search('sofia').subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('q') === 'sofia');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { employees: [], departments: [], jobs: [], announcements: [] } });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AnnouncementApi } from './announcement-api';
import { environment } from '../../../environments/environment';

describe('AnnouncementApi', () => {
  let service: AnnouncementApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/announcements`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AnnouncementApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists announcements', () => {
    service.list({ page: 1, pageSize: 20 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('creates an announcement', () => {
    const value = { title: 'Update', content: 'Body' };
    service.create(value).subscribe();
    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ data: {} });
  });

  it('updates an announcement', () => {
    service.update('ann-1', { title: 'New title' }).subscribe();
    const req = httpMock.expectOne(`${baseUrl}/ann-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: {} });
  });

  it('deletes an announcement by id', () => {
    service.delete('ann-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/ann-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

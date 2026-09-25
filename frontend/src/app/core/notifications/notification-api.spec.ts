import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationApi } from './notification-api';
import { environment } from '../../../environments/environment';

describe('NotificationApi', () => {
  let service: NotificationApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/notifications`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists notifications with an optional unreadOnly filter', () => {
    service.list({ page: 1, pageSize: 20, unreadOnly: true }).subscribe();
    const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('unreadOnly') === 'true');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], page: 1, pageSize: 20, total: 0 });
  });

  it('fetches the unread count', () => {
    service.unreadCount().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { count: 3 } });
  });

  it('marks a notification as read', () => {
    service.markRead('n-1').subscribe();
    const req = httpMock.expectOne(`${baseUrl}/n-1/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ data: {} });
  });

  it('marks all notifications as read', () => {
    service.markAllRead().subscribe();
    const req = httpMock.expectOne(`${baseUrl}/read-all`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });
});

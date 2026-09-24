import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthApi } from './auth-api';
import { environment } from '../../../environments/environment';

describe('AuthApi', () => {
  let service: AuthApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts credentials to /auth/login', () => {
    const request = { email: 'admin@worksphere.local', password: 'Password123!' };
    service.login(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ user: {}, accessToken: 'token' });
  });

  it('posts registration details to /auth/register', () => {
    const request = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@worksphere.local',
      password: 'Password123!',
    };
    service.register(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ user: {}, accessToken: 'token' });
  });

  it('fetches the current user from /auth/me', () => {
    service.me().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush({ user: {} });
  });

  it('posts to /auth/change-password', () => {
    const request = { currentPassword: 'Password123!', newPassword: 'NewPassword123' };
    service.changePassword(request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it('propagates an error response to the caller', () => {
    let capturedError: unknown;
    service.login({ email: 'x', password: 'wrong' }).subscribe({
      error: (err) => (capturedError = err),
    });

    const req = httpMock.expectOne(`${baseUrl}/login`);
    req.flush({ error: { message: 'Invalid email or password' } }, { status: 401, statusText: 'Unauthorized' });

    expect(capturedError).toBeTruthy();
  });
});

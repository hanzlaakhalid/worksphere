import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UploadApi } from './upload-api';
import { environment } from '../../../environments/environment';

describe('UploadApi', () => {
  let service: UploadApi;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/uploads`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UploadApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('posts the file as multipart form data', () => {
    const file = new File(['content'], 'avatar.png', { type: 'image/png' });
    service.upload(file).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ url: '/uploads/generated.png' });
  });
});

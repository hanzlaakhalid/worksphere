import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.model';

@Service()
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request);
  }

  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/me`);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/change-password`, request);
  }
}

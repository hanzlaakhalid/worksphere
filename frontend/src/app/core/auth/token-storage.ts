import { Service } from '@angular/core';

const ACCESS_TOKEN_KEY = 'worksphere_access_token';

@Service()
export class TokenStorage {
  getToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // localStorage unavailable (private mode, disabled storage) - auth simply won't persist across reloads.
    }
  }

  clearToken(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // no-op
    }
  }
}

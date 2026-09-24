import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let service: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns null when no token is stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    service.setToken('abc.def.ghi');
    expect(service.getToken()).toBe('abc.def.ghi');
  });

  it('clears a stored token', () => {
    service.setToken('abc.def.ghi');
    service.clearToken();
    expect(service.getToken()).toBeNull();
  });
});

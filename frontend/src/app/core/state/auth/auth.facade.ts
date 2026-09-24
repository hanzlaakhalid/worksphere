import { Service, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthActions } from './auth.actions';
import {
  selectAuthError,
  selectAuthInitializing,
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
} from './auth.selectors';
import { LoginRequest, RegisterRequest } from '../../models/auth.model';

/**
 * Bridges the NgRx Auth store to Signals so components/guards can read
 * auth state without sprinkling `Store` + selectors throughout the app.
 */
@Service()
export class AuthFacade {
  private readonly store = inject(Store);

  readonly currentUser = toSignal(this.store.select(selectCurrentUser), { initialValue: null });
  readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });
  readonly role = toSignal(this.store.select(selectUserRole), { initialValue: null });
  readonly loading = toSignal(this.store.select(selectAuthLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectAuthError), { initialValue: null });
  readonly initializing = toSignal(this.store.select(selectAuthInitializing), { initialValue: true });

  login(request: LoginRequest, returnUrl?: string): void {
    this.store.dispatch(AuthActions.login({ request, returnUrl }));
  }

  register(request: RegisterRequest): void {
    this.store.dispatch(AuthActions.register({ request }));
  }

  loadCurrentUser(): void {
    this.store.dispatch(AuthActions.loadCurrentUser());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}

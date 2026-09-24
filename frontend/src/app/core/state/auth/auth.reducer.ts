import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, AuthActions.register, (state): AuthState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    loading: false,
    error: null,
    initializing: false,
  })),

  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }): AuthState => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.loadCurrentUser, (state): AuthState => ({ ...state, initializing: true })),

  on(AuthActions.loadCurrentUserSuccess, (state, { user }): AuthState => ({
    ...state,
    user,
    initializing: false,
  })),

  on(AuthActions.loadCurrentUserFailure, (state): AuthState => ({
    ...state,
    user: null,
    initializing: false,
  })),

  on(AuthActions.logout, (): AuthState => ({ ...initialAuthState, initializing: false })),
);

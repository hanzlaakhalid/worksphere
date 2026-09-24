import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);

export const selectIsAuthenticated = createSelector(selectCurrentUser, (user) => user !== null);

export const selectUserRole = createSelector(selectCurrentUser, (user) => user?.role ?? null);

export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);

export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

export const selectAuthInitializing = createSelector(selectAuthState, (state) => state.initializing);

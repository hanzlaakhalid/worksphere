import { authReducer } from './auth.reducer';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';
import { User } from '../../models/user.model';

const testUser: User = {
  id: '1',
  email: 'admin@worksphere.local',
  firstName: 'Alex',
  lastName: 'Admin',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe('authReducer', () => {
  it('returns the initial state for an unknown action', () => {
    const state = authReducer(undefined, { type: 'noop' });
    expect(state).toEqual(initialAuthState);
  });

  it('sets loading on login and clears it on success with the user', () => {
    const loadingState = authReducer(initialAuthState, AuthActions.login({ request: { email: '', password: '' } }));
    expect(loadingState.loading).toBe(true);

    const successState = authReducer(
      loadingState,
      AuthActions.loginSuccess({ user: testUser, accessToken: 'token' }),
    );
    expect(successState.loading).toBe(false);
    expect(successState.user).toEqual(testUser);
    expect(successState.initializing).toBe(false);
  });

  it('stores the error message on login failure without touching the user', () => {
    const state = authReducer(initialAuthState, AuthActions.loginFailure({ error: 'Invalid email or password' }));
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid email or password');
    expect(state.user).toBeNull();
  });

  it('resets to a logged-out state on logout', () => {
    const loggedIn = { user: testUser, loading: false, error: null, initializing: false };
    const state = authReducer(loggedIn, AuthActions.logout());
    expect(state.user).toBeNull();
    expect(state.initializing).toBe(false);
  });

  it('marks initializing false with no user on loadCurrentUserFailure', () => {
    const state = authReducer(initialAuthState, AuthActions.loadCurrentUserFailure());
    expect(state.user).toBeNull();
    expect(state.initializing).toBe(false);
  });
});

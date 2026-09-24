import { User } from '../../models/user.model';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** True until the initial token-based session check has resolved (app bootstrap / hard refresh). */
  initializing: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initializing: true,
};

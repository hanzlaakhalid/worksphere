import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../models/user.model';
import { LoginRequest, RegisterRequest } from '../../models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ request: LoginRequest; returnUrl?: string }>(),
    'Login Success': props<{ user: User; accessToken: string }>(),
    'Login Failure': props<{ error: string }>(),

    Register: props<{ request: RegisterRequest }>(),
    'Register Success': props<{ user: User; accessToken: string }>(),
    'Register Failure': props<{ error: string }>(),

    'Load Current User': emptyProps(),
    'Load Current User Success': props<{ user: User }>(),
    'Load Current User Failure': emptyProps(),

    Logout: emptyProps(),
  },
});

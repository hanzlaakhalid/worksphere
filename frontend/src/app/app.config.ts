import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { authReducer } from './core/state/auth/auth.reducer';
import { AuthEffects } from './core/state/auth/auth.effects';
import { AuthActions } from './core/state/auth/auth.actions';
import { selectAuthInitializing } from './core/state/auth/auth.selectors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideAppInitializer(() => {
      const store = inject(Store);
      store.dispatch(AuthActions.loadCurrentUser());
      return firstValueFrom(store.select(selectAuthInitializing).pipe(filter((initializing) => !initializing)));
    }),
  ],
};

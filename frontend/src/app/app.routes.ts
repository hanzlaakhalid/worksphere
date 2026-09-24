import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'admin-only',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/home/admin-only/admin-only').then((m) => m.AdminOnly),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/pages/forbidden/forbidden').then((m) => m.Forbidden),
  },
  { path: '**', redirectTo: 'home' },
];

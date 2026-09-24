import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';
import { roleHomeRedirect } from './core/guards/role-home-redirect';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./shared/pages/forbidden/forbidden').then((m) => m.Forbidden),
  },
  { path: '', pathMatch: 'full', redirectTo: roleHomeRedirect },
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'employees',
        data: { title: 'Employees' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'departments',
        data: { title: 'Departments' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'reports',
        data: { title: 'Reports' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
  {
    path: 'hr',
    canActivate: [roleGuard(['HR_MANAGER'])],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/hr-dashboard/hr-dashboard').then((m) => m.HrDashboard),
      },
      {
        path: 'employees',
        data: { title: 'Employees' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'leave',
        data: { title: 'Leave Management' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'recruitment',
        data: { title: 'Recruitment' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'payroll',
        data: { title: 'Payroll' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
  {
    path: 'manager',
    canActivate: [roleGuard(['MANAGER'])],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/manager-dashboard/manager-dashboard').then((m) => m.ManagerDashboard),
      },
      {
        path: 'team',
        data: { title: 'Team' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'leave',
        data: { title: 'Leave' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'performance',
        data: { title: 'Performance' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
  {
    path: 'employee',
    canActivate: [roleGuard(['EMPLOYEE'])],
    loadComponent: () => import('./layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/employee-dashboard/employee-dashboard').then((m) => m.EmployeeDashboard),
      },
      {
        path: 'profile',
        data: { title: 'Profile' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'attendance',
        data: { title: 'Attendance' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'leave',
        data: { title: 'Leave' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
      {
        path: 'payroll',
        data: { title: 'Payroll' },
        loadComponent: () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon),
      },
    ],
  },
  { path: '**', redirectTo: roleHomeRedirect },
];

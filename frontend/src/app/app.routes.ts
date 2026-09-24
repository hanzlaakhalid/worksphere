import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';
import { roleHomeRedirect } from './core/guards/role-home-redirect';

const comingSoon = () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon);
const employeeList = () => import('./features/employees/employee-list/employee-list').then((m) => m.EmployeeList);
const employeeForm = () => import('./features/employees/employee-form/employee-form').then((m) => m.EmployeeForm);
const employeeDetail = () =>
  import('./features/employees/employee-detail/employee-detail').then((m) => m.EmployeeDetail);
const departmentList = () =>
  import('./features/departments/department-list/department-list').then((m) => m.DepartmentList);

/** Employee CRUD routes reused across role prefixes with a role-appropriate basePath/canManage. */
function employeeRoutes(basePath: string, canManage: boolean) {
  return [
    { path: '', loadComponent: employeeList, data: { basePath, canManage } },
    ...(canManage
      ? [{ path: 'new', loadComponent: employeeForm, data: { basePath, canManage } }]
      : []),
    { path: ':id', loadComponent: employeeDetail, data: { basePath, canManage } },
    ...(canManage
      ? [{ path: ':id/edit', loadComponent: employeeForm, data: { basePath, canManage } }]
      : []),
  ];
}

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
      { path: 'employees', children: employeeRoutes('/admin/employees', true) },
      { path: 'departments', loadComponent: departmentList },
      { path: 'reports', data: { title: 'Reports' }, loadComponent: comingSoon },
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
      { path: 'employees', children: employeeRoutes('/hr/employees', true) },
      { path: 'departments', loadComponent: departmentList },
      { path: 'leave', data: { title: 'Leave Management' }, loadComponent: comingSoon },
      { path: 'recruitment', data: { title: 'Recruitment' }, loadComponent: comingSoon },
      { path: 'payroll', data: { title: 'Payroll' }, loadComponent: comingSoon },
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
      { path: 'team', children: employeeRoutes('/manager/team', false) },
      { path: 'leave', data: { title: 'Leave' }, loadComponent: comingSoon },
      { path: 'performance', data: { title: 'Performance' }, loadComponent: comingSoon },
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
      { path: 'profile', data: { title: 'Profile' }, loadComponent: comingSoon },
      { path: 'attendance', data: { title: 'Attendance' }, loadComponent: comingSoon },
      { path: 'leave', data: { title: 'Leave' }, loadComponent: comingSoon },
      { path: 'payroll', data: { title: 'Payroll' }, loadComponent: comingSoon },
    ],
  },
  { path: '**', redirectTo: roleHomeRedirect },
];

import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { roleGuard } from './core/guards/role-guard';
import { roleHomeRedirect } from './core/guards/role-home-redirect';

const comingSoon = () => import('./shared/pages/coming-soon/coming-soon').then((m) => m.ComingSoon);
const employeeList = () => import('./features/employees/employee-list/employee-list').then((m) => m.EmployeeList);
const employeeForm = () => import('./features/employees/employee-form/employee-form').then((m) => m.EmployeeForm);
const employeeDetail = () =>
  import('./features/employees/employee-detail/employee-detail').then((m) => m.EmployeeDetail);
const departmentList = () =>
  import('./features/departments/department-list/department-list').then((m) => m.DepartmentList);
const attendanceList = () =>
  import('./features/attendance/attendance-list/attendance-list').then((m) => m.AttendanceList);
const leaveList = () => import('./features/leave/leave-list/leave-list').then((m) => m.LeaveList);
const performanceList = () =>
  import('./features/performance/performance-list/performance-list').then((m) => m.PerformanceList);
const recruitmentDashboard = () =>
  import('./features/recruitment/recruitment-dashboard/recruitment-dashboard').then((m) => m.RecruitmentDashboard);
const jobList = () => import('./features/recruitment/job-list/job-list').then((m) => m.JobList);
const applicationList = () =>
  import('./features/recruitment/application-list/application-list').then((m) => m.ApplicationList);
const payrollList = () => import('./features/payroll/payroll-list/payroll-list').then((m) => m.PayrollList);
const documentList = () => import('./features/documents/document-list/document-list').then((m) => m.DocumentList);
const announcementList = () =>
  import('./features/announcements/announcement-list/announcement-list').then((m) => m.AnnouncementList);
const chartProviders = [provideCharts(withDefaultRegisterables())];

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
        providers: chartProviders,
        loadComponent: () => import('./features/dashboard/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      { path: 'employees', children: employeeRoutes('/admin/employees', true) },
      { path: 'departments', loadComponent: departmentList },
      { path: 'documents', data: { mode: 'manage' }, loadComponent: documentList },
      { path: 'announcements', data: { mode: 'manage' }, loadComponent: announcementList },
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
        providers: chartProviders,
        loadComponent: () => import('./features/dashboard/hr-dashboard/hr-dashboard').then((m) => m.HrDashboard),
      },
      { path: 'employees', children: employeeRoutes('/hr/employees', true) },
      { path: 'departments', loadComponent: departmentList },
      { path: 'attendance', data: { scope: 'scoped' }, loadComponent: attendanceList },
      { path: 'leave', data: { mode: 'review' }, loadComponent: leaveList },
      {
        path: 'recruitment',
        children: [
          { path: '', providers: chartProviders, loadComponent: recruitmentDashboard },
          { path: 'jobs', loadComponent: jobList },
          { path: 'applications', loadComponent: applicationList },
        ],
      },
      { path: 'payroll', data: { mode: 'manage' }, loadComponent: payrollList },
      { path: 'documents', data: { mode: 'manage' }, loadComponent: documentList },
      { path: 'announcements', data: { mode: 'manage' }, loadComponent: announcementList },
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
        providers: chartProviders,
        loadComponent: () =>
          import('./features/dashboard/manager-dashboard/manager-dashboard').then((m) => m.ManagerDashboard),
      },
      { path: 'team', children: employeeRoutes('/manager/team', false) },
      { path: 'attendance', data: { scope: 'scoped' }, loadComponent: attendanceList },
      { path: 'leave', data: { mode: 'review' }, loadComponent: leaveList },
      { path: 'performance', data: { mode: 'team' }, providers: chartProviders, loadComponent: performanceList },
      { path: 'payroll', data: { mode: 'self' }, loadComponent: payrollList },
      { path: 'documents', data: { mode: 'self' }, loadComponent: documentList },
      { path: 'announcements', data: { mode: 'view' }, loadComponent: announcementList },
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
        providers: chartProviders,
        loadComponent: () =>
          import('./features/dashboard/employee-dashboard/employee-dashboard').then((m) => m.EmployeeDashboard),
      },
      { path: 'profile', data: { title: 'Profile' }, loadComponent: comingSoon },
      { path: 'attendance', data: { scope: 'self' }, loadComponent: attendanceList },
      { path: 'leave', data: { mode: 'self' }, loadComponent: leaveList },
      { path: 'performance', data: { mode: 'self' }, providers: chartProviders, loadComponent: performanceList },
      { path: 'payroll', data: { mode: 'self' }, loadComponent: payrollList },
      { path: 'documents', data: { mode: 'self' }, loadComponent: documentList },
      { path: 'announcements', data: { mode: 'view' }, loadComponent: announcementList },
    ],
  },
  { path: '**', redirectTo: roleHomeRedirect },
];

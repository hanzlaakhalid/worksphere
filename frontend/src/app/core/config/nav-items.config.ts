import { Role } from '../models/user.model';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Employees', icon: 'group', route: '/admin/employees' },
    { label: 'Departments', icon: 'apartment', route: '/admin/departments' },
    { label: 'Reports', icon: 'bar_chart', route: '/admin/reports' },
  ],
  HR_MANAGER: [
    { label: 'Dashboard', icon: 'dashboard', route: '/hr/dashboard' },
    { label: 'Employees', icon: 'group', route: '/hr/employees' },
    { label: 'Leave Management', icon: 'event_available', route: '/hr/leave' },
    { label: 'Recruitment', icon: 'work', route: '/hr/recruitment' },
    { label: 'Payroll', icon: 'payments', route: '/hr/payroll' },
  ],
  MANAGER: [
    { label: 'Dashboard', icon: 'dashboard', route: '/manager/dashboard' },
    { label: 'Team', icon: 'groups', route: '/manager/team' },
    { label: 'Leave', icon: 'event_available', route: '/manager/leave' },
    { label: 'Performance', icon: 'insights', route: '/manager/performance' },
  ],
  EMPLOYEE: [
    { label: 'Dashboard', icon: 'dashboard', route: '/employee/dashboard' },
    { label: 'Profile', icon: 'person', route: '/employee/profile' },
    { label: 'Attendance', icon: 'event_available', route: '/employee/attendance' },
    { label: 'Leave', icon: 'beach_access', route: '/employee/leave' },
    { label: 'Payroll', icon: 'payments', route: '/employee/payroll' },
  ],
};

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
    { label: 'Documents', icon: 'folder', route: '/admin/documents' },
    { label: 'Announcements', icon: 'campaign', route: '/admin/announcements' },
    { label: 'Reports', icon: 'bar_chart', route: '/admin/reports' },
  ],
  HR_MANAGER: [
    { label: 'Dashboard', icon: 'dashboard', route: '/hr/dashboard' },
    { label: 'Employees', icon: 'group', route: '/hr/employees' },
    { label: 'Departments', icon: 'apartment', route: '/hr/departments' },
    { label: 'Attendance', icon: 'event_available', route: '/hr/attendance' },
    { label: 'Leave Management', icon: 'beach_access', route: '/hr/leave' },
    { label: 'Recruitment', icon: 'work', route: '/hr/recruitment' },
    { label: 'Payroll', icon: 'payments', route: '/hr/payroll' },
    { label: 'Documents', icon: 'folder', route: '/hr/documents' },
    { label: 'Announcements', icon: 'campaign', route: '/hr/announcements' },
  ],
  MANAGER: [
    { label: 'Dashboard', icon: 'dashboard', route: '/manager/dashboard' },
    { label: 'Team', icon: 'groups', route: '/manager/team' },
    { label: 'Attendance', icon: 'event_available', route: '/manager/attendance' },
    { label: 'Leave', icon: 'beach_access', route: '/manager/leave' },
    { label: 'Performance', icon: 'insights', route: '/manager/performance' },
    { label: 'Payroll', icon: 'payments', route: '/manager/payroll' },
    { label: 'Documents', icon: 'folder', route: '/manager/documents' },
    { label: 'Announcements', icon: 'campaign', route: '/manager/announcements' },
  ],
  EMPLOYEE: [
    { label: 'Dashboard', icon: 'dashboard', route: '/employee/dashboard' },
    { label: 'Profile', icon: 'person', route: '/employee/profile' },
    { label: 'Attendance', icon: 'event_available', route: '/employee/attendance' },
    { label: 'Leave', icon: 'beach_access', route: '/employee/leave' },
    { label: 'Performance', icon: 'insights', route: '/employee/performance' },
    { label: 'Payroll', icon: 'payments', route: '/employee/payroll' },
    { label: 'Documents', icon: 'folder', route: '/employee/documents' },
    { label: 'Announcements', icon: 'campaign', route: '/employee/announcements' },
  ],
};

import { BadgeVariant } from '../../shared/ui/status-badge/status-badge';
import { EmployeeStatus } from '../models/employee.model';
import { AttendanceStatus } from '../models/attendance.model';
import { LeaveStatus } from '../models/leave.model';

export function employeeStatusVariant(status: EmployeeStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ON_LEAVE':
      return 'warning';
    case 'TERMINATED':
      return 'danger';
    case 'INACTIVE':
    default:
      return 'neutral';
  }
}

export function attendanceStatusVariant(status: AttendanceStatus): BadgeVariant {
  switch (status) {
    case 'PRESENT':
      return 'success';
    case 'LATE':
    case 'HALF_DAY':
      return 'warning';
    case 'ON_LEAVE':
      return 'neutral';
    case 'ABSENT':
    default:
      return 'danger';
  }
}

export function leaveStatusVariant(status: LeaveStatus): BadgeVariant {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'PENDING':
    default:
      return 'warning';
  }
}

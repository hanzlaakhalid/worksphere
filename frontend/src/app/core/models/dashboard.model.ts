import { EmployeeStatus } from './employee.model';
import { LeaveStatus, LeaveType } from './leave.model';

export interface EmployeeSummary {
  total: number;
  byStatus: Record<EmployeeStatus, number>;
  byDepartment: { department: string; count: number }[];
}

export interface EmployeeGrowth {
  labels: string[];
  counts: number[];
}

export interface LeaveSummary {
  byStatus: Record<LeaveStatus, number>;
  byType: Record<LeaveType, number>;
}

export interface AttendanceTrend {
  labels: string[];
  presentPercent: number[];
}

export interface PayrollSummary {
  currentMonthTotal: string;
  byDepartment: { department: string; total: string }[];
}

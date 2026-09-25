import type { EmployeeStatus, LeaveStatus, LeaveType } from '@prisma/client';

export interface EmployeeSummaryDto {
  total: number;
  byStatus: Record<EmployeeStatus, number>;
  byDepartment: { department: string; count: number }[];
}

export interface EmployeeGrowthDto {
  labels: string[];
  counts: number[];
}

export interface LeaveSummaryDto {
  byStatus: Record<LeaveStatus, number>;
  byType: Record<LeaveType, number>;
}

export interface AttendanceTrendDto {
  labels: string[];
  presentPercent: number[];
}

export interface PayrollSummaryDto {
  currentMonthTotal: string;
  byDepartment: { department: string; total: string }[];
}

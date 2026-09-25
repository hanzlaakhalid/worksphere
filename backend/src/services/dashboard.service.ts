import type { EmployeeStatus, LeaveStatus, LeaveType, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { resolveEmployeeId, resolveTeamEmployeeIds } from './employee-scope.util';
import { dateRange, todayDateOnly } from '../lib/date';
import type {
  AttendanceTrendDto,
  EmployeeGrowthDto,
  EmployeeSummaryDto,
  LeaveSummaryDto,
  PayrollSummaryDto,
} from '../types/dashboard.types';

const ALL_EMPLOYEE_STATUSES: EmployeeStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
const ALL_LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const ALL_LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'UNPAID'];
const PRESENT_LIKE_STATUSES = new Set(['PRESENT', 'LATE', 'HALF_DAY']);

export const dashboardService = {
  async getEmployeeSummary(requester: { userId: string; role: Role }): Promise<EmployeeSummaryDto> {
    const where: Prisma.EmployeeWhereInput = {};
    if (requester.role === 'MANAGER') {
      where.managerId = await resolveEmployeeId(requester.userId);
    }

    const [total, statusGroups, deptGroups, departments] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.employee.groupBy({ by: ['departmentId'], where, _count: { _all: true } }),
      prisma.department.findMany({ select: { id: true, name: true } }),
    ]);

    const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
    const byStatus = Object.fromEntries(
      ALL_EMPLOYEE_STATUSES.map((status) => [status, statusCounts[status] ?? 0]),
    ) as Record<EmployeeStatus, number>;

    const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
    const byDepartment = deptGroups
      .filter((g) => g.departmentId)
      .map((g) => ({ department: deptNameById.get(g.departmentId!) ?? 'Unknown', count: g._count._all }));

    return { total, byStatus, byDepartment };
  },

  async getEmployeeGrowth(months: number): Promise<EmployeeGrowthDto> {
    const now = todayDateOnly();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

    const employees = await prisma.employee.findMany({
      where: { joiningDate: { gte: start } },
      select: { joiningDate: true },
    });

    const labels: string[] = [];
    const bucketKeys: string[] = [];
    const counts: number[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      bucketKeys.push(`${d.getUTCFullYear()}-${d.getUTCMonth()}`);
      labels.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }));
      counts.push(0);
    }

    for (const e of employees) {
      if (!e.joiningDate) continue;
      const key = `${e.joiningDate.getUTCFullYear()}-${e.joiningDate.getUTCMonth()}`;
      const index = bucketKeys.indexOf(key);
      if (index !== -1) counts[index] += 1;
    }

    return { labels, counts };
  },

  async getLeaveSummary(requester: { userId: string; role: Role }): Promise<LeaveSummaryDto> {
    const where: Prisma.LeaveRequestWhereInput = {};
    if (requester.role === 'EMPLOYEE') {
      where.employeeId = await resolveEmployeeId(requester.userId);
    } else if (requester.role === 'MANAGER') {
      const teamIds = await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId));
      where.employeeId = { in: teamIds };
    }

    const [statusGroups, typeGroups] = await Promise.all([
      prisma.leaveRequest.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.leaveRequest.groupBy({ by: ['leaveType'], where, _count: { _all: true } }),
    ]);

    const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
    const byStatus = Object.fromEntries(
      ALL_LEAVE_STATUSES.map((status) => [status, statusCounts[status] ?? 0]),
    ) as Record<LeaveStatus, number>;

    const typeCounts = Object.fromEntries(typeGroups.map((g) => [g.leaveType, g._count._all]));
    const byType = Object.fromEntries(ALL_LEAVE_TYPES.map((type) => [type, typeCounts[type] ?? 0])) as Record<
      LeaveType,
      number
    >;

    return { byStatus, byType };
  },

  async getAttendanceTrend(days: number, requester: { userId: string; role: Role }): Promise<AttendanceTrendDto> {
    const today = todayDateOnly();
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const where: Prisma.AttendanceWhereInput = { date: { gte: start, lte: today } };
    if (requester.role === 'MANAGER') {
      const teamIds = await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId));
      where.employeeId = { in: teamIds };
    }

    const records = await prisma.attendance.findMany({ where, select: { date: true, status: true } });

    const dates = dateRange(start, today);
    const labels = dates.map((d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }));

    const presentPercent = dates.map((d) => {
      const dayRecords = records.filter((r) => r.date.getTime() === d.getTime());
      if (dayRecords.length === 0) return 0;
      const presentCount = dayRecords.filter((r) => PRESENT_LIKE_STATUSES.has(r.status)).length;
      return Math.round((presentCount / dayRecords.length) * 100);
    });

    return { labels, presentPercent };
  },

  async getPayrollSummary(): Promise<PayrollSummaryDto> {
    const now = todayDateOnly();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const records = await prisma.payroll.findMany({
      where: { month: monthStart },
      select: { netSalary: true, employee: { select: { department: { select: { name: true } } } } },
    });

    const total = records.reduce((sum, r) => sum + Number(r.netSalary), 0);

    const byDeptMap = new Map<string, number>();
    for (const r of records) {
      const name = r.employee.department?.name ?? 'Unassigned';
      byDeptMap.set(name, (byDeptMap.get(name) ?? 0) + Number(r.netSalary));
    }

    return {
      currentMonthTotal: total.toFixed(2),
      byDepartment: [...byDeptMap.entries()].map(([department, deptTotal]) => ({
        department,
        total: deptTotal.toFixed(2),
      })),
    };
  },
};

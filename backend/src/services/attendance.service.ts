import type { Prisma, Role } from '@prisma/client';
import { attendanceRepository, AttendanceWithRelations } from '../repositories/attendance.repository';
import { resolveEmployeeId, resolveTeamEmployeeIds } from './employee-scope.util';
import { todayDateOnly } from '../lib/date';
import type { ListAttendanceQuery } from '../validation/attendance.validation';
import type { AttendanceDto, AttendanceStatsDto, PaginatedResult } from '../types/attendance.types';

function toDto(record: AttendanceWithRelations): AttendanceDto {
  return {
    id: record.id,
    employee: {
      id: record.employee.id,
      employeeCode: `EMP-${String(record.employee.sequence).padStart(4, '0')}`,
      firstName: record.employee.user.firstName,
      lastName: record.employee.user.lastName,
      department: record.employee.department?.name ?? null,
    },
    date: record.date,
    checkIn: record.checkIn,
    checkOut: record.checkOut,
    workingHours: record.workingHours ? record.workingHours.toString() : null,
    status: record.status,
  };
}

async function scopedWhere(
  query: ListAttendanceQuery,
  requester: { userId: string; role: Role },
): Promise<Prisma.AttendanceWhereInput> {
  const where: Prisma.AttendanceWhereInput = {};

  if (query.dateFrom || query.dateTo) {
    where.date = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.department) {
    where.employee = { departmentId: query.department };
  }

  if (requester.role === 'EMPLOYEE') {
    where.employeeId = await resolveEmployeeId(requester.userId);
  } else if (requester.role === 'MANAGER') {
    const teamIds = await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId));
    where.employeeId = { in: teamIds };
  } else if (query.employeeId) {
    where.employeeId = query.employeeId;
  }

  return where;
}

export const attendanceService = {
  async list(
    query: ListAttendanceQuery,
    requester: { userId: string; role: Role },
  ): Promise<PaginatedResult<AttendanceDto>> {
    const where = await scopedWhere(query, requester);

    const { items, total } = await attendanceRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async statsToday(requester: { userId: string; role: Role }): Promise<AttendanceStatsDto> {
    const where: Prisma.AttendanceWhereInput = { date: todayDateOnly() };

    if (requester.role === 'MANAGER') {
      const teamIds = await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId));
      where.employeeId = { in: teamIds };
    }

    const grouped = await attendanceRepository.countByStatus(where);
    const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

    return {
      present: counts['PRESENT'] ?? 0,
      absent: counts['ABSENT'] ?? 0,
      late: counts['LATE'] ?? 0,
      halfDay: counts['HALF_DAY'] ?? 0,
      onLeave: counts['ON_LEAVE'] ?? 0,
    };
  },
};

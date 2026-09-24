import type { Prisma, Role } from '@prisma/client';
import { leaveRepository, LeaveWithRelations } from '../repositories/leave.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { resolveEmployeeId, resolveTeamEmployeeIds } from './employee-scope.util';
import { dateRange } from '../lib/date';
import { ApiError } from '../lib/apiError';
import type { CreateLeaveInput, ListLeavesQuery, RejectLeaveInput } from '../validation/leave.validation';
import type { LeaveRequestDto, PaginatedResult } from '../types/leave.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDto(leave: LeaveWithRelations): LeaveRequestDto {
  const durationDays = Math.round((leave.endDate.getTime() - leave.startDate.getTime()) / MS_PER_DAY) + 1;

  return {
    id: leave.id,
    employee: {
      id: leave.employee.id,
      employeeCode: `EMP-${String(leave.employee.sequence).padStart(4, '0')}`,
      firstName: leave.employee.user.firstName,
      lastName: leave.employee.user.lastName,
      department: leave.employee.department?.name ?? null,
    },
    leaveType: leave.leaveType,
    startDate: leave.startDate,
    endDate: leave.endDate,
    durationDays,
    reason: leave.reason,
    attachmentUrl: leave.attachmentUrl,
    status: leave.status,
    reviewedBy: leave.reviewedBy
      ? { id: leave.reviewedBy.id, firstName: leave.reviewedBy.user.firstName, lastName: leave.reviewedBy.user.lastName }
      : null,
    reviewNote: leave.reviewNote,
    createdAt: leave.createdAt,
  };
}

async function requireReviewableByRequester(
  id: string,
  requester: { userId: string; role: Role },
): Promise<LeaveWithRelations> {
  const leave = await leaveRepository.findById(id);
  if (!leave) {
    throw ApiError.notFound('Leave request not found');
  }
  if (leave.status !== 'PENDING') {
    throw ApiError.conflict('This request has already been reviewed');
  }

  if (requester.role === 'MANAGER') {
    const managerEmployeeId = await resolveEmployeeId(requester.userId);
    if (leave.employee.managerId !== managerEmployeeId) {
      throw ApiError.forbidden('You can only review requests from your own team');
    }
  }

  return leave;
}

export const leaveService = {
  async list(query: ListLeavesQuery, requester: { userId: string; role: Role }): Promise<PaginatedResult<LeaveRequestDto>> {
    const where: Prisma.LeaveRequestWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.leaveType) {
      where.leaveType = query.leaveType;
    }

    if (requester.role === 'EMPLOYEE') {
      where.employeeId = await resolveEmployeeId(requester.userId);
    } else if (requester.role === 'MANAGER') {
      const teamIds = await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId));
      where.employeeId = { in: teamIds };
    }

    const { items, total } = await leaveRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreateLeaveInput, requester: { userId: string }): Promise<LeaveRequestDto> {
    const employeeId = await resolveEmployeeId(requester.userId);

    const leave = await leaveRepository.create({
      employee: { connect: { id: employeeId } },
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      attachmentUrl: input.attachmentUrl || null,
    });

    return toDto(leave);
  },

  async approve(id: string, requester: { userId: string; role: Role }): Promise<LeaveRequestDto> {
    const leave = await requireReviewableByRequester(id, requester);
    const reviewerEmployeeId = await resolveEmployeeId(requester.userId);

    const updated = await leaveRepository.update(id, {
      status: 'APPROVED',
      reviewedBy: { connect: { id: reviewerEmployeeId } },
      reviewNote: null,
    });

    for (const date of dateRange(leave.startDate, leave.endDate)) {
      await attendanceRepository.upsertForDate(leave.employeeId, date, {
        employeeId: leave.employeeId,
        date,
        status: 'ON_LEAVE',
      });
    }

    return toDto(updated);
  },

  async reject(id: string, input: RejectLeaveInput, requester: { userId: string; role: Role }): Promise<LeaveRequestDto> {
    await requireReviewableByRequester(id, requester);
    const reviewerEmployeeId = await resolveEmployeeId(requester.userId);

    const updated = await leaveRepository.update(id, {
      status: 'REJECTED',
      reviewedBy: { connect: { id: reviewerEmployeeId } },
      reviewNote: input.reviewNote,
    });

    return toDto(updated);
  },
};

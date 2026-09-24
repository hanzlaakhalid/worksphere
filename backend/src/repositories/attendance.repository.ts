import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const attendanceWithRelations = {
  include: {
    employee: {
      select: {
        id: true,
        sequence: true,
        user: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
      },
    },
  },
} satisfies Prisma.AttendanceDefaultArgs;

export type AttendanceWithRelations = Prisma.AttendanceGetPayload<typeof attendanceWithRelations>;

export const attendanceRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.AttendanceWhereInput;
  }): Promise<{ items: AttendanceWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.attendance.findMany({
        where: params.where,
        orderBy: { date: 'desc' },
        skip: params.skip,
        take: params.take,
        ...attendanceWithRelations,
      }),
      prisma.attendance.count({ where: params.where }),
    ]);
    return { items, total };
  },

  countByStatus(where: Prisma.AttendanceWhereInput) {
    return prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });
  },

  upsertForDate(employeeId: string, date: Date, data: Prisma.AttendanceUncheckedCreateInput) {
    return prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { status: data.status },
      create: data,
    });
  },
};

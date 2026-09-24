import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const leaveWithRelations = {
  include: {
    employee: {
      select: {
        id: true,
        sequence: true,
        managerId: true,
        user: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
      },
    },
    reviewedBy: { include: { user: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.LeaveRequestDefaultArgs;

export type LeaveWithRelations = Prisma.LeaveRequestGetPayload<typeof leaveWithRelations>;

export const leaveRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.LeaveRequestWhereInput;
  }): Promise<{ items: LeaveWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where: params.where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...leaveWithRelations,
      }),
      prisma.leaveRequest.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<LeaveWithRelations | null> {
    return prisma.leaveRequest.findUnique({ where: { id }, ...leaveWithRelations });
  },

  create(data: Prisma.LeaveRequestCreateInput): Promise<LeaveWithRelations> {
    return prisma.leaveRequest.create({ data, ...leaveWithRelations });
  },

  update(id: string, data: Prisma.LeaveRequestUpdateInput): Promise<LeaveWithRelations> {
    return prisma.leaveRequest.update({ where: { id }, data, ...leaveWithRelations });
  },
};

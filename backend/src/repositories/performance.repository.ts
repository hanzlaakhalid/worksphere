import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const employeeSelect = {
  select: {
    id: true,
    sequence: true,
    user: { select: { firstName: true, lastName: true } },
  },
} satisfies { select: Prisma.EmployeeSelect };

const reviewWithRelations = {
  include: {
    employee: employeeSelect,
    reviewer: employeeSelect,
  },
} satisfies Prisma.PerformanceReviewDefaultArgs;

export type PerformanceReviewWithRelations = Prisma.PerformanceReviewGetPayload<typeof reviewWithRelations>;

export const performanceRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.PerformanceReviewWhereInput;
  }): Promise<{ items: PerformanceReviewWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where: params.where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...reviewWithRelations,
      }),
      prisma.performanceReview.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<PerformanceReviewWithRelations | null> {
    return prisma.performanceReview.findUnique({ where: { id }, ...reviewWithRelations });
  },

  create(data: Prisma.PerformanceReviewCreateInput): Promise<PerformanceReviewWithRelations> {
    return prisma.performanceReview.create({ data, ...reviewWithRelations });
  },

  update(id: string, data: Prisma.PerformanceReviewUpdateInput): Promise<PerformanceReviewWithRelations> {
    return prisma.performanceReview.update({ where: { id }, data, ...reviewWithRelations });
  },
};

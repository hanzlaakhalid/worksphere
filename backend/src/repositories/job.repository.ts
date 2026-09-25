import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const jobWithRelations = {
  include: {
    department: { select: { id: true, name: true } },
    _count: { select: { applications: true } },
  },
} satisfies Prisma.JobDefaultArgs;

export type JobWithRelations = Prisma.JobGetPayload<typeof jobWithRelations>;

export const jobRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.JobWhereInput;
  }): Promise<{ items: JobWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where: params.where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...jobWithRelations,
      }),
      prisma.job.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<JobWithRelations | null> {
    return prisma.job.findUnique({ where: { id }, ...jobWithRelations });
  },

  create(data: Prisma.JobCreateInput): Promise<JobWithRelations> {
    return prisma.job.create({ data, ...jobWithRelations });
  },

  update(id: string, data: Prisma.JobUpdateInput): Promise<JobWithRelations> {
    return prisma.job.update({ where: { id }, data, ...jobWithRelations });
  },

  delete(id: string) {
    return prisma.job.delete({ where: { id } });
  },

  countOpen() {
    return prisma.job.count({ where: { status: 'OPEN' } });
  },
};

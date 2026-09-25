import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const applicationWithRelations = {
  include: {
    job: { select: { id: true, title: true } },
    applicant: true,
    interviews: {
      include: { interviewer: { include: { user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { scheduledAt: 'desc' },
    },
  },
} satisfies Prisma.ApplicationDefaultArgs;

export type ApplicationWithRelations = Prisma.ApplicationGetPayload<typeof applicationWithRelations>;

export const applicationRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.ApplicationWhereInput;
  }): Promise<{ items: ApplicationWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where: params.where,
        orderBy: { appliedAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...applicationWithRelations,
      }),
      prisma.application.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<ApplicationWithRelations | null> {
    return prisma.application.findUnique({ where: { id }, ...applicationWithRelations });
  },

  create(data: Prisma.ApplicationCreateInput): Promise<ApplicationWithRelations> {
    return prisma.application.create({ data, ...applicationWithRelations });
  },

  updateStatus(id: string, status: Prisma.ApplicationUpdateInput['status']): Promise<ApplicationWithRelations> {
    return prisma.application.update({ where: { id }, data: { status }, ...applicationWithRelations });
  },

  countByStatus() {
    return prisma.application.groupBy({ by: ['status'], _count: { _all: true } });
  },

  countApplicants() {
    return prisma.applicant.count();
  },

  findApplicantByEmail(email: string) {
    return prisma.applicant.findUnique({ where: { email } });
  },

  createApplicant(data: Prisma.ApplicantCreateInput) {
    return prisma.applicant.create({ data });
  },

  addInterview(applicationId: string, data: Omit<Prisma.InterviewCreateInput, 'application'>) {
    return prisma.interview.create({ data: { ...data, application: { connect: { id: applicationId } } } });
  },
};

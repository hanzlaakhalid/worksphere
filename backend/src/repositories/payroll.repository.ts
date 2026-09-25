import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const payrollWithRelations = {
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
} satisfies Prisma.PayrollDefaultArgs;

export type PayrollWithRelations = Prisma.PayrollGetPayload<typeof payrollWithRelations>;

export const payrollRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.PayrollWhereInput;
  }): Promise<{ items: PayrollWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.payroll.findMany({
        where: params.where,
        orderBy: { month: 'desc' },
        skip: params.skip,
        take: params.take,
        ...payrollWithRelations,
      }),
      prisma.payroll.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<PayrollWithRelations | null> {
    return prisma.payroll.findUnique({ where: { id }, ...payrollWithRelations });
  },

  findByEmployeeAndMonth(employeeId: string, month: Date) {
    return prisma.payroll.findUnique({ where: { employeeId_month: { employeeId, month } } });
  },

  create(data: Prisma.PayrollCreateInput): Promise<PayrollWithRelations> {
    return prisma.payroll.create({ data, ...payrollWithRelations });
  },

  update(id: string, data: Prisma.PayrollUpdateInput): Promise<PayrollWithRelations> {
    return prisma.payroll.update({ where: { id }, data, ...payrollWithRelations });
  },

  delete(id: string) {
    return prisma.payroll.delete({ where: { id } });
  },
};

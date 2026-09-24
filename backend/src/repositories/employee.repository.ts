import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const employeeWithRelations = {
  include: {
    user: { select: { firstName: true, lastName: true, email: true, role: true } },
    department: { select: { id: true, name: true } },
    manager: { include: { user: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.EmployeeDefaultArgs;

export type EmployeeWithRelations = Prisma.EmployeeGetPayload<typeof employeeWithRelations>;

export const employeeRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.EmployeeWhereInput;
    orderBy: Prisma.EmployeeOrderByWithRelationInput;
  }): Promise<{ items: EmployeeWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        ...employeeWithRelations,
      }),
      prisma.employee.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<EmployeeWithRelations | null> {
    return prisma.employee.findUnique({ where: { id }, ...employeeWithRelations });
  },

  findByUserId(userId: string): Promise<EmployeeWithRelations | null> {
    return prisma.employee.findUnique({ where: { userId }, ...employeeWithRelations });
  },

  findOptions(): Promise<{ id: string; user: { firstName: string; lastName: string } }[]> {
    return prisma.employee.findMany({
      select: { id: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { user: { firstName: 'asc' } },
    });
  },

  create(data: Prisma.EmployeeCreateInput): Promise<EmployeeWithRelations> {
    return prisma.employee.create({ data, ...employeeWithRelations });
  },

  update(id: string, data: Prisma.EmployeeUpdateInput): Promise<EmployeeWithRelations> {
    return prisma.employee.update({ where: { id }, data, ...employeeWithRelations });
  },
};

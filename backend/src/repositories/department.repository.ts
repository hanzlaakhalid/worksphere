import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const departmentWithRelations = {
  include: {
    manager: { include: { user: { select: { firstName: true, lastName: true } } } },
    _count: { select: { employees: true } },
  },
} satisfies Prisma.DepartmentDefaultArgs;

export type DepartmentWithRelations = Prisma.DepartmentGetPayload<typeof departmentWithRelations>;

export const departmentRepository = {
  findAll(): Promise<DepartmentWithRelations[]> {
    return prisma.department.findMany({ ...departmentWithRelations, orderBy: { name: 'asc' } });
  },

  findById(id: string): Promise<DepartmentWithRelations | null> {
    return prisma.department.findUnique({ where: { id }, ...departmentWithRelations });
  },

  findByName(name: string) {
    return prisma.department.findUnique({ where: { name } });
  },

  create(data: Prisma.DepartmentCreateInput): Promise<DepartmentWithRelations> {
    return prisma.department.create({ data, ...departmentWithRelations });
  },

  update(id: string, data: Prisma.DepartmentUpdateInput): Promise<DepartmentWithRelations> {
    return prisma.department.update({ where: { id }, data, ...departmentWithRelations });
  },

  delete(id: string) {
    return prisma.department.delete({ where: { id } });
  },
};

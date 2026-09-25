import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const documentWithRelations = {
  include: {
    employee: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
    uploadedBy: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.DocumentDefaultArgs;

export type DocumentWithRelations = Prisma.DocumentGetPayload<typeof documentWithRelations>;

export const documentRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.DocumentWhereInput;
  }): Promise<{ items: DocumentWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where: params.where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...documentWithRelations,
      }),
      prisma.document.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<DocumentWithRelations | null> {
    return prisma.document.findUnique({ where: { id }, ...documentWithRelations });
  },

  create(data: Prisma.DocumentCreateInput): Promise<DocumentWithRelations> {
    return prisma.document.create({ data, ...documentWithRelations });
  },

  delete(id: string) {
    return prisma.document.delete({ where: { id } });
  },
};

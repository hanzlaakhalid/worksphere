import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

const announcementWithRelations = {
  include: {
    createdBy: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.AnnouncementDefaultArgs;

export type AnnouncementWithRelations = Prisma.AnnouncementGetPayload<typeof announcementWithRelations>;

export const announcementRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.AnnouncementWhereInput;
  }): Promise<{ items: AnnouncementWithRelations[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.announcement.findMany({
        where: params.where,
        orderBy: { publishedAt: 'desc' },
        skip: params.skip,
        take: params.take,
        ...announcementWithRelations,
      }),
      prisma.announcement.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<AnnouncementWithRelations | null> {
    return prisma.announcement.findUnique({ where: { id }, ...announcementWithRelations });
  },

  create(data: Prisma.AnnouncementCreateInput): Promise<AnnouncementWithRelations> {
    return prisma.announcement.create({ data, ...announcementWithRelations });
  },

  update(id: string, data: Prisma.AnnouncementUpdateInput): Promise<AnnouncementWithRelations> {
    return prisma.announcement.update({ where: { id }, data, ...announcementWithRelations });
  },

  delete(id: string) {
    return prisma.announcement.delete({ where: { id } });
  },
};

import { prisma } from '../lib/prisma';
import type { Notification, Prisma } from '@prisma/client';

export const notificationRepository = {
  async findMany(params: {
    skip: number;
    take: number;
    where: Prisma.NotificationWhereInput;
  }): Promise<{ items: Notification[]; total: number }> {
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: params.where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.notification.count({ where: params.where }),
    ]);
    return { items, total };
  },

  findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  },

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({ data });
  },

  createMany(data: Prisma.NotificationCreateManyInput[]) {
    return prisma.notification.createMany({ data });
  },

  markRead(id: string): Promise<Notification> {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};

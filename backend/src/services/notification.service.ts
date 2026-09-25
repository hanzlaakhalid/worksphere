import type { NotificationType } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/apiError';
import type { ListNotificationsQuery } from '../validation/notification.validation';
import type { NotificationDto, PaginatedResult } from '../types/notification.types';

function toDto(notification: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export const notificationService = {
  async list(query: ListNotificationsQuery, requester: { userId: string }): Promise<PaginatedResult<NotificationDto>> {
    const { items, total } = await notificationRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where: { userId: requester.userId, ...(query.unreadOnly ? { isRead: false } : {}) },
    });
    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  unreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  async markRead(id: string, requester: { userId: string }): Promise<NotificationDto> {
    const existing = await notificationRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Notification not found');
    }
    if (existing.userId !== requester.userId) {
      throw ApiError.forbidden('You can only manage your own notifications');
    }
    const updated = await notificationRepository.markRead(id);
    return toDto(updated);
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  /** Fire-and-forget internal helper: other services call this on key events rather than emitting a real event bus. */
  async notify(params: { userId: string; type: NotificationType; title: string; message: string; link?: string | null }): Promise<void> {
    await notificationRepository.create({
      user: { connect: { id: params.userId } },
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    });
  },

  /** Broadcasts to every active user - used when an announcement is published. */
  async notifyAll(params: { type: NotificationType; title: string; message: string; link?: string | null }): Promise<void> {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    if (users.length === 0) return;
    await notificationRepository.createMany(
      users.map((u) => ({
        userId: u.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
      })),
    );
  },
};

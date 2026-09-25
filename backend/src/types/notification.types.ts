import type { NotificationType } from '@prisma/client';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

import type { Prisma, Role } from '@prisma/client';
import { announcementRepository, AnnouncementWithRelations } from '../repositories/announcement.repository';
import { notificationService } from './notification.service';
import { resolveEmployeeId } from './employee-scope.util';
import { ApiError } from '../lib/apiError';
import type { CreateAnnouncementInput, ListAnnouncementsQuery, UpdateAnnouncementInput } from '../validation/announcement.validation';
import type { AnnouncementDto, PaginatedResult } from '../types/announcement.types';

function toDto(announcement: AnnouncementWithRelations): AnnouncementDto {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    publishedAt: announcement.publishedAt,
    expiresAt: announcement.expiresAt,
    createdBy: {
      id: announcement.createdBy.id,
      firstName: announcement.createdBy.user.firstName,
      lastName: announcement.createdBy.user.lastName,
    },
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}

const MANAGE_ROLES: Role[] = ['ADMIN', 'HR_MANAGER'];

export const announcementService = {
  async list(query: ListAnnouncementsQuery, requester: { role: Role }): Promise<PaginatedResult<AnnouncementDto>> {
    const where: Prisma.AnnouncementWhereInput = {};

    if (!MANAGE_ROLES.includes(requester.role)) {
      const now = new Date();
      where.publishedAt = { lte: now };
      where.OR = [{ expiresAt: null }, { expiresAt: { gte: now } }];
    }

    const { items, total } = await announcementRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreateAnnouncementInput, requester: { userId: string }): Promise<AnnouncementDto> {
    const creatorEmployeeId = await resolveEmployeeId(requester.userId);

    const announcement = await announcementRepository.create({
      title: input.title,
      content: input.content,
      ...(input.publishedAt ? { publishedAt: input.publishedAt } : {}),
      expiresAt: input.expiresAt ?? null,
      createdBy: { connect: { id: creatorEmployeeId } },
    });

    await notificationService.notifyAll({
      type: 'ANNOUNCEMENT',
      title: 'New announcement',
      message: announcement.title,
    });

    return toDto(announcement);
  },

  async update(id: string, input: UpdateAnnouncementInput): Promise<AnnouncementDto> {
    const existing = await announcementRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Announcement not found');
    }

    const announcement = await announcementRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });
    return toDto(announcement);
  },

  async delete(id: string): Promise<void> {
    const existing = await announcementRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Announcement not found');
    }
    await announcementRepository.delete(id);
  },
};

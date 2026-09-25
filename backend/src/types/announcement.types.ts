export interface AnnouncementAuthorDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  expiresAt: Date | null;
  createdBy: AnnouncementAuthorDto;
  createdAt: Date;
  updatedAt: Date;
}

export type { PaginatedResult } from './pagination.types';

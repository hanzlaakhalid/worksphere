import type { DocumentCategory } from '@prisma/client';

export interface DocumentPersonDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DocumentDto {
  id: string;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  employee: DocumentPersonDto | null;
  uploadedBy: DocumentPersonDto;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

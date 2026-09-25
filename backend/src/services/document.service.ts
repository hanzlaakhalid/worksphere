import type { Prisma, Role } from '@prisma/client';
import { documentRepository, DocumentWithRelations } from '../repositories/document.repository';
import { notificationService } from './notification.service';
import { resolveEmployeeId, resolveUserForEmployeeId, notificationLink } from './employee-scope.util';
import { ApiError } from '../lib/apiError';
import type { CreateDocumentInput, ListDocumentsQuery } from '../validation/document.validation';
import type { DocumentDto, PaginatedResult } from '../types/document.types';

function toDto(document: DocumentWithRelations): DocumentDto {
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    fileUrl: document.fileUrl,
    employee: document.employee
      ? { id: document.employee.id, firstName: document.employee.user.firstName, lastName: document.employee.user.lastName }
      : null,
    uploadedBy: {
      id: document.uploadedBy.id,
      firstName: document.uploadedBy.user.firstName,
      lastName: document.uploadedBy.user.lastName,
    },
    createdAt: document.createdAt,
  };
}

const MANAGE_ROLES: Role[] = ['ADMIN', 'HR_MANAGER'];

export const documentService = {
  async list(query: ListDocumentsQuery, requester: { userId: string; role: Role }): Promise<PaginatedResult<DocumentDto>> {
    const where: Prisma.DocumentWhereInput = {};
    if (query.category) {
      where.category = query.category;
    }

    if (MANAGE_ROLES.includes(requester.role)) {
      if (query.employeeId) {
        where.employeeId = query.employeeId;
      }
    } else {
      const ownEmployeeId = await resolveEmployeeId(requester.userId);
      where.OR = [{ employeeId: ownEmployeeId }, { employeeId: null }];
    }

    const { items, total } = await documentRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreateDocumentInput, requester: { userId: string; role: Role }): Promise<DocumentDto> {
    const uploaderEmployeeId = await resolveEmployeeId(requester.userId);

    // Only HR/Admin may target someone else, or leave it unset for a company-wide document.
    const targetEmployeeId = MANAGE_ROLES.includes(requester.role) ? (input.employeeId ?? null) : uploaderEmployeeId;

    const document = await documentRepository.create({
      title: input.title,
      category: input.category,
      fileUrl: input.fileUrl,
      ...(targetEmployeeId ? { employee: { connect: { id: targetEmployeeId } } } : {}),
      uploadedBy: { connect: { id: uploaderEmployeeId } },
    });

    if (targetEmployeeId && targetEmployeeId !== uploaderEmployeeId) {
      const recipient = await resolveUserForEmployeeId(targetEmployeeId);
      if (recipient) {
        await notificationService.notify({
          userId: recipient.userId,
          type: 'DOCUMENT_UPLOADED',
          title: 'New document uploaded',
          message: `"${document.title}" was added to your documents.`,
          link: notificationLink(recipient.role, 'documents'),
        });
      }
    }

    return toDto(document);
  },

  async delete(id: string, requester: { userId: string; role: Role }): Promise<void> {
    const existing = await documentRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Document not found');
    }

    if (!MANAGE_ROLES.includes(requester.role)) {
      const uploaderEmployeeId = await resolveEmployeeId(requester.userId);
      if (existing.uploadedBy.id !== uploaderEmployeeId) {
        throw ApiError.forbidden('You can only delete documents you uploaded');
      }
    }

    await documentRepository.delete(id);
  },
};

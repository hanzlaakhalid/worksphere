import { z } from 'zod';

const categoryEnum = z.enum(['POLICY', 'CONTRACT', 'CERTIFICATE', 'ID_PROOF', 'OTHER']);

export const listDocumentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    category: categoryEnum.optional(),
    employeeId: z.string().trim().optional(),
  }),
});

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(150),
    category: categoryEnum.default('OTHER'),
    fileUrl: z.string().trim().min(1, 'A file must be uploaded'),
    employeeId: z.string().trim().optional().nullable(),
  }),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>['query'];
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>['body'];

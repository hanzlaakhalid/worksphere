import { z } from 'zod';

export const listAnnouncementsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const createAnnouncementSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(2).max(150),
      content: z.string().trim().min(2).max(5000),
      publishedAt: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional().nullable(),
    })
    .refine((data) => !data.expiresAt || !data.publishedAt || data.expiresAt >= data.publishedAt, {
      message: 'Expiry date must be on or after the publish date',
      path: ['expiresAt'],
    }),
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(150).optional(),
    content: z.string().trim().min(2).max(5000).optional(),
    publishedAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export type ListAnnouncementsQuery = z.infer<typeof listAnnouncementsQuerySchema>['query'];
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>['body'];
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>['body'];

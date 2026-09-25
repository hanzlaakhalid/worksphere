import { z } from 'zod';

const applicationStatusEnum = z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED']);

export const listApplicationsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    jobId: z.string().trim().optional(),
    status: applicationStatusEnum.optional(),
  }),
});

export const createApplicationSchema = z.object({
  body: z.object({
    jobId: z.string().trim().min(1, 'Job is required'),
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    resumeUrl: z.string().trim().max(500).optional().nullable(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: applicationStatusEnum,
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const createInterviewSchema = z.object({
  body: z.object({
    scheduledAt: z.coerce.date(),
    interviewerId: z.string().trim().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>['query'];
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>['body'];
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>['body'];
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>['body'];

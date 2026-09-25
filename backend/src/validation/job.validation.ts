import { z } from 'zod';

const employmentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
const jobStatusEnum = z.enum(['OPEN', 'ON_HOLD', 'CLOSED']);

export const listJobsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: jobStatusEnum.optional(),
  }),
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(150),
    departmentId: z.string().trim().optional().nullable(),
    description: z.string().trim().min(10).max(3000),
    requirements: z.string().trim().min(10).max(3000),
    location: z.string().trim().min(2).max(150),
    employmentType: employmentTypeEnum,
    salaryRangeMin: z.coerce.number().min(0).optional().nullable(),
    salaryRangeMax: z.coerce.number().min(0).optional().nullable(),
    status: jobStatusEnum.default('OPEN'),
  }),
});

export const updateJobSchema = z.object({
  body: createJobSchema.shape.body.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>['query'];
export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];

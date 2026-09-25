import { z } from 'zod';

const ratingEnum = z.enum([
  'OUTSTANDING',
  'EXCEEDS_EXPECTATIONS',
  'MEETS_EXPECTATIONS',
  'NEEDS_IMPROVEMENT',
  'UNSATISFACTORY',
]);

export const listPerformanceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    employeeId: z.string().trim().optional(),
  }),
});

export const createPerformanceReviewSchema = z.object({
  body: z.object({
    employeeId: z.string().trim().min(1, 'Employee is required'),
    reviewPeriod: z.string().trim().min(2, 'Review period is required').max(50),
    overallRating: ratingEnum,
    goals: z.string().trim().min(5).max(1000),
    achievements: z.string().trim().min(5).max(1000),
    strengths: z.string().trim().min(5).max(1000),
    areasForImprovement: z.string().trim().min(5).max(1000),
    managerComments: z.string().trim().min(5).max(1000),
  }),
});

export const updatePerformanceReviewSchema = z.object({
  body: createPerformanceReviewSchema.shape.body.omit({ employeeId: true }).partial(),
  params: z.object({ id: z.string().min(1) }),
});

export type ListPerformanceQuery = z.infer<typeof listPerformanceQuerySchema>['query'];
export type CreatePerformanceReviewInput = z.infer<typeof createPerformanceReviewSchema>['body'];
export type UpdatePerformanceReviewInput = z.infer<typeof updatePerformanceReviewSchema>['body'];

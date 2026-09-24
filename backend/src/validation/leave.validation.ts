import { z } from 'zod';

const leaveTypeEnum = z.enum(['ANNUAL', 'SICK', 'CASUAL', 'EMERGENCY', 'UNPAID']);
const leaveStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const listLeavesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: leaveStatusEnum.optional(),
    leaveType: leaveTypeEnum.optional(),
  }),
});

export const createLeaveSchema = z.object({
  body: z
    .object({
      leaveType: leaveTypeEnum,
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      reason: z.string().trim().min(5, 'Reason must be at least 5 characters').max(500),
      attachmentUrl: z.string().trim().max(500).optional().nullable(),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: 'End date must be on or after the start date',
      path: ['endDate'],
    }),
});

export const rejectLeaveSchema = z.object({
  body: z.object({
    reviewNote: z.string().trim().min(5, 'A reason is required when rejecting a request').max(500),
  }),
});

export type ListLeavesQuery = z.infer<typeof listLeavesQuerySchema>['query'];
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>['body'];
export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>['body'];

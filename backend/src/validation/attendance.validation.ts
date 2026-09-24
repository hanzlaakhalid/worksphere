import { z } from 'zod';

const attendanceStatusEnum = z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE']);

export const listAttendanceQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    employeeId: z.string().trim().optional(),
    department: z.string().trim().optional(),
    status: attendanceStatusEnum.optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }),
});

export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>['query'];

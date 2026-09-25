import { z } from 'zod';

export const employeeGrowthQuerySchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(24).default(6),
  }),
});

export const attendanceTrendQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(14),
  }),
});

export type EmployeeGrowthQuery = z.infer<typeof employeeGrowthQuerySchema>['query'];
export type AttendanceTrendQuery = z.infer<typeof attendanceTrendQuerySchema>['query'];

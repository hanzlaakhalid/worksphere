import { z } from 'zod';

const paymentStatusEnum = z.enum(['PENDING', 'PAID']);

export const listPayrollQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    employeeId: z.string().trim().optional(),
    paymentStatus: paymentStatusEnum.optional(),
  }),
});

/** netSalary is always server-computed (basic + allowances + bonuses - deductions - tax), never trusted from the client. */
export const createPayrollSchema = z.object({
  body: z.object({
    employeeId: z.string().trim().min(1, 'Employee is required'),
    month: z.coerce.date(),
    basicSalary: z.coerce.number().min(0),
    allowances: z.coerce.number().min(0).default(0),
    bonuses: z.coerce.number().min(0).default(0),
    deductions: z.coerce.number().min(0).default(0),
    tax: z.coerce.number().min(0).default(0),
    paymentStatus: paymentStatusEnum.default('PENDING'),
  }),
});

export const updatePayrollSchema = z.object({
  body: createPayrollSchema.shape.body.omit({ employeeId: true, month: true }).partial(),
  params: z.object({ id: z.string().min(1) }),
});

export type ListPayrollQuery = z.infer<typeof listPayrollQuerySchema>['query'];
export type CreatePayrollInput = z.infer<typeof createPayrollSchema>['body'];
export type UpdatePayrollInput = z.infer<typeof updatePayrollSchema>['body'];

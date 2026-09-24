import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    managerId: z.string().trim().optional().nullable(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: createDepartmentSchema.shape.body.partial(),
  params: z.object({ id: z.string().min(1) }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>['body'];

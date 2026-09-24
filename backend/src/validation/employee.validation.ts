import { z } from 'zod';

const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);
const employmentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
const sortableFields = z.enum(['firstName', 'lastName', 'email', 'joiningDate', 'status', 'createdAt']);

export const listEmployeesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    department: z.string().trim().optional(),
    status: employeeStatusEnum.optional(),
    sortBy: sortableFields.default('firstName'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    dateOfBirth: z.coerce.date().optional().nullable(),
    gender: genderEnum.optional().nullable(),
    address: z.string().trim().max(255).optional().or(z.literal('')),
    departmentId: z.string().trim().optional().nullable(),
    position: z.string().trim().max(100).optional().or(z.literal('')),
    managerId: z.string().trim().optional().nullable(),
    joiningDate: z.coerce.date().optional().nullable(),
    employmentType: employmentTypeEnum.default('FULL_TIME'),
    salary: z.coerce.number().min(0).max(100_000_000).optional().nullable(),
    status: employeeStatusEnum.default('ACTIVE'),
    profilePictureUrl: z.string().trim().max(500).optional().nullable(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: createEmployeeSchema.shape.body.omit({ email: true }).partial(),
  params: z.object({ id: z.string().min(1) }),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>['query'];
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];

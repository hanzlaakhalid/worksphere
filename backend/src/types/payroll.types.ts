import type { PaymentStatus } from '@prisma/client';

export interface PayrollEmployeeDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface PayrollDto {
  id: string;
  employee: PayrollEmployeeDto;
  month: Date;
  basicSalary: string;
  allowances: string;
  bonuses: string;
  deductions: string;
  tax: string;
  netSalary: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

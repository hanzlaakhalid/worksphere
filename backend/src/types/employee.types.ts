import type { EmployeeStatus, EmploymentType, Gender, Role } from '@prisma/client';

export interface EmployeeSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface EmployeeDepartmentDto {
  id: string;
  name: string;
}

export interface EmployeeDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  address: string | null;
  department: EmployeeDepartmentDto | null;
  position: string | null;
  manager: EmployeeSummaryDto | null;
  joiningDate: Date | null;
  employmentType: EmploymentType;
  salary: string | null;
  status: EmployeeStatus;
  profilePictureUrl: string | null;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

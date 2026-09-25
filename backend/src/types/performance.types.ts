import type { PerformanceRating } from '@prisma/client';

export interface PerformanceEmployeeDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface PerformanceReviewDto {
  id: string;
  employee: PerformanceEmployeeDto;
  reviewer: PerformanceEmployeeDto;
  reviewPeriod: string;
  overallRating: PerformanceRating;
  goals: string;
  achievements: string;
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

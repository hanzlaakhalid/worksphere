import type { LeaveStatus, LeaveType } from '@prisma/client';

export interface LeaveEmployeeDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface LeaveReviewerDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface LeaveRequestDto {
  id: string;
  employee: LeaveEmployeeDto;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  reason: string;
  attachmentUrl: string | null;
  status: LeaveStatus;
  reviewedBy: LeaveReviewerDto | null;
  reviewNote: string | null;
  createdAt: Date;
}

export type { PaginatedResult } from './pagination.types';

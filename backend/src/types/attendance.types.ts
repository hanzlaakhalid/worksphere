import type { AttendanceStatus } from '@prisma/client';

export interface AttendanceEmployeeDto {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface AttendanceDto {
  id: string;
  employee: AttendanceEmployeeDto;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  workingHours: string | null;
  status: AttendanceStatus;
}

export interface AttendanceStatsDto {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
}

export type { PaginatedResult } from './pagination.types';

import type { ApplicationStatus, EmploymentType, JobStatus } from '@prisma/client';

export interface JobDepartmentDto {
  id: string;
  name: string;
}

export interface JobDto {
  id: string;
  title: string;
  department: JobDepartmentDto | null;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  salaryRangeMin: string | null;
  salaryRangeMax: string | null;
  status: JobStatus;
  applicationCount: number;
  createdAt: Date;
}

export interface ApplicantDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
}

export interface InterviewDto {
  id: string;
  scheduledAt: Date;
  interviewer: { id: string; firstName: string; lastName: string } | null;
  notes: string | null;
  createdAt: Date;
}

export interface ApplicationDto {
  id: string;
  job: { id: string; title: string };
  applicant: ApplicantDto;
  status: ApplicationStatus;
  appliedAt: Date;
  interviews: InterviewDto[];
}

export interface RecruitmentStatsDto {
  openJobs: number;
  totalApplicants: number;
  byStatus: Record<ApplicationStatus, number>;
}

export type { PaginatedResult } from './pagination.types';

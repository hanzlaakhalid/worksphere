import { EmploymentType } from './employee.model';

export type JobStatus = 'OPEN' | 'ON_HOLD' | 'CLOSED';
export type ApplicationStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';

export interface JobDepartment {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  department: JobDepartment | null;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  salaryRangeMin: string | null;
  salaryRangeMax: string | null;
  status: JobStatus;
  applicationCount: number;
  createdAt: string;
}

export interface JobOption {
  id: string;
  title: string;
}

export interface JobFormValue {
  title: string;
  departmentId: string | null;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  salaryRangeMin: number | null;
  salaryRangeMax: number | null;
  status: JobStatus;
}

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  resumeUrl: string | null;
}

export interface Interview {
  id: string;
  scheduledAt: string;
  interviewer: { id: string; firstName: string; lastName: string } | null;
  notes: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  job: { id: string; title: string };
  applicant: Applicant;
  status: ApplicationStatus;
  appliedAt: string;
  interviews: Interview[];
}

export interface RecruitmentStats {
  openJobs: number;
  totalApplicants: number;
  byStatus: Record<ApplicationStatus, number>;
}

export interface ApplicationFormValue {
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string | null;
}

export interface InterviewFormValue {
  scheduledAt: string;
  interviewerId: string | null;
  notes: string | null;
}

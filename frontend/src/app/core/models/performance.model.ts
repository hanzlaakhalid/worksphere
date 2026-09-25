export type PerformanceRating =
  | 'OUTSTANDING'
  | 'EXCEEDS_EXPECTATIONS'
  | 'MEETS_EXPECTATIONS'
  | 'NEEDS_IMPROVEMENT'
  | 'UNSATISFACTORY';

export interface PerformanceEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface PerformanceReview {
  id: string;
  employee: PerformanceEmployee;
  reviewer: PerformanceEmployee;
  reviewPeriod: string;
  overallRating: PerformanceRating;
  goals: string;
  achievements: string;
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
  createdAt: string;
}

export interface PerformanceListQuery {
  page: number;
  pageSize: number;
  employeeId?: string;
}

export interface PerformanceFormValue {
  employeeId: string;
  reviewPeriod: string;
  overallRating: PerformanceRating;
  goals: string;
  achievements: string;
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
}

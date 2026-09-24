export type LeaveType = 'ANNUAL' | 'SICK' | 'CASUAL' | 'EMERGENCY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface LeaveReviewer {
  id: string;
  firstName: string;
  lastName: string;
}

export interface LeaveRequest {
  id: string;
  employee: LeaveEmployee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason: string;
  attachmentUrl: string | null;
  status: LeaveStatus;
  reviewedBy: LeaveReviewer | null;
  reviewNote: string | null;
  createdAt: string;
}

export interface LeaveListQuery {
  page: number;
  pageSize: number;
  status?: LeaveStatus;
  leaveType?: LeaveType;
}

export interface LeaveFormValue {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl: string | null;
}

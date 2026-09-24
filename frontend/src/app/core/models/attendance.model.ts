export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';

export interface AttendanceEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface Attendance {
  id: string;
  employee: AttendanceEmployee;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: string | null;
  status: AttendanceStatus;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
}

export interface AttendanceListQuery {
  page: number;
  pageSize: number;
  employeeId?: string;
  department?: string;
  status?: AttendanceStatus;
  dateFrom?: string;
  dateTo?: string;
}

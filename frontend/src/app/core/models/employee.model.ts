import { Role } from './user.model';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface EmployeeDepartment {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string | null;
  department: EmployeeDepartment | null;
  position: string | null;
  manager: EmployeeSummary | null;
  joiningDate: string | null;
  employmentType: EmploymentType;
  salary: string | null;
  status: EmployeeStatus;
  profilePictureUrl: string | null;
  createdAt: string;
}

export interface EmployeeOption {
  id: string;
  name: string;
}

export interface EmployeeListQuery {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  status?: EmployeeStatus;
  sortBy?: 'firstName' | 'lastName' | 'email' | 'joiningDate' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  address: string;
  departmentId: string | null;
  position: string;
  managerId: string | null;
  joiningDate: string | null;
  employmentType: EmploymentType;
  salary: number | null;
  status: EmployeeStatus;
  profilePictureUrl: string | null;
}

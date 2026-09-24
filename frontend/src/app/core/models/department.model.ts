export interface DepartmentManagerSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager: DepartmentManagerSummary | null;
  employeeCount: number;
  createdAt: string;
}

export interface DepartmentFormValue {
  name: string;
  description: string;
  managerId: string | null;
}

export interface DepartmentManagerSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
  description: string | null;
  manager: DepartmentManagerSummary | null;
  employeeCount: number;
  createdAt: Date;
}

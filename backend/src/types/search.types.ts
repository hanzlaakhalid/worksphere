export interface SearchEmployeeResult {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface SearchDepartmentResult {
  id: string;
  name: string;
}

export interface SearchJobResult {
  id: string;
  title: string;
  status: string;
}

export interface SearchAnnouncementResult {
  id: string;
  title: string;
}

export interface SearchResults {
  employees: SearchEmployeeResult[];
  departments: SearchDepartmentResult[];
  jobs: SearchJobResult[];
  announcements: SearchAnnouncementResult[];
}

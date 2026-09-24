export type Role = 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

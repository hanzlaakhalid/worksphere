export type PaymentStatus = 'PENDING' | 'PAID';

export interface PayrollEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string | null;
}

export interface Payroll {
  id: string;
  employee: PayrollEmployee;
  month: string;
  basicSalary: string;
  allowances: string;
  bonuses: string;
  deductions: string;
  tax: string;
  netSalary: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface PayrollListQuery {
  page: number;
  pageSize: number;
  employeeId?: string;
  paymentStatus?: PaymentStatus;
}

export interface PayrollFormValue {
  employeeId: string;
  month: string;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  tax: number;
  paymentStatus: PaymentStatus;
}

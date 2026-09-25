import type { Prisma, Role } from '@prisma/client';
import { payrollRepository, PayrollWithRelations } from '../repositories/payroll.repository';
import { resolveEmployeeId } from './employee-scope.util';
import { ApiError } from '../lib/apiError';
import type { CreatePayrollInput, ListPayrollQuery, UpdatePayrollInput } from '../validation/payroll.validation';
import type { PaginatedResult, PayrollDto } from '../types/payroll.types';

function toDto(payroll: PayrollWithRelations): PayrollDto {
  return {
    id: payroll.id,
    employee: {
      id: payroll.employee.id,
      employeeCode: `EMP-${String(payroll.employee.sequence).padStart(4, '0')}`,
      firstName: payroll.employee.user.firstName,
      lastName: payroll.employee.user.lastName,
      department: payroll.employee.department?.name ?? null,
    },
    month: payroll.month,
    basicSalary: payroll.basicSalary.toString(),
    allowances: payroll.allowances.toString(),
    bonuses: payroll.bonuses.toString(),
    deductions: payroll.deductions.toString(),
    tax: payroll.tax.toString(),
    netSalary: payroll.netSalary.toString(),
    paymentStatus: payroll.paymentStatus,
    createdAt: payroll.createdAt,
  };
}

function computeNetSalary(parts: { basicSalary: number; allowances: number; bonuses: number; deductions: number; tax: number }): number {
  return parts.basicSalary + parts.allowances + parts.bonuses - parts.deductions - parts.tax;
}

export const payrollService = {
  async list(query: ListPayrollQuery, requester: { userId: string; role: Role }): Promise<PaginatedResult<PayrollDto>> {
    const where: Prisma.PayrollWhereInput = {};

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (requester.role === 'EMPLOYEE' || requester.role === 'MANAGER') {
      where.employeeId = await resolveEmployeeId(requester.userId);
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const { items, total } = await payrollRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreatePayrollInput): Promise<PayrollDto> {
    const existing = await payrollRepository.findByEmployeeAndMonth(input.employeeId, input.month);
    if (existing) {
      throw ApiError.conflict('A payroll record already exists for this employee and month');
    }

    const netSalary = computeNetSalary(input);

    const payroll = await payrollRepository.create({
      employee: { connect: { id: input.employeeId } },
      month: input.month,
      basicSalary: input.basicSalary,
      allowances: input.allowances,
      bonuses: input.bonuses,
      deductions: input.deductions,
      tax: input.tax,
      netSalary,
      paymentStatus: input.paymentStatus,
    });

    return toDto(payroll);
  },

  async update(id: string, input: UpdatePayrollInput): Promise<PayrollDto> {
    const existing = await payrollRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Payroll record not found');
    }

    const merged = {
      basicSalary: input.basicSalary ?? Number(existing.basicSalary),
      allowances: input.allowances ?? Number(existing.allowances),
      bonuses: input.bonuses ?? Number(existing.bonuses),
      deductions: input.deductions ?? Number(existing.deductions),
      tax: input.tax ?? Number(existing.tax),
    };
    const netSalary = computeNetSalary(merged);

    const payroll = await payrollRepository.update(id, {
      ...merged,
      netSalary,
      ...(input.paymentStatus !== undefined ? { paymentStatus: input.paymentStatus } : {}),
    });

    return toDto(payroll);
  },

  async delete(id: string): Promise<void> {
    const existing = await payrollRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Payroll record not found');
    }
    await payrollRepository.delete(id);
  },
};

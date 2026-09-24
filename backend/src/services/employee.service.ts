import type { Prisma, Role } from '@prisma/client';
import { employeeRepository, EmployeeWithRelations } from '../repositories/employee.repository';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/apiError';
import { hashPassword } from '../lib/password';
import { resolveEmployeeId } from './employee-scope.util';
import type { CreateEmployeeInput, ListEmployeesQuery, UpdateEmployeeInput } from '../validation/employee.validation';
import type { EmployeeDto, PaginatedResult } from '../types/employee.types';

/**
 * HR-created employees are onboarded with this default password (mirrors the
 * seed data). A production system would email a reset/invite link instead;
 * that's out of scope for this project.
 */
const DEFAULT_EMPLOYEE_PASSWORD = 'Password123!';

function toDto(employee: EmployeeWithRelations): EmployeeDto {
  return {
    id: employee.id,
    employeeCode: `EMP-${String(employee.sequence).padStart(4, '0')}`,
    firstName: employee.user.firstName,
    lastName: employee.user.lastName,
    email: employee.user.email,
    role: employee.user.role,
    phone: employee.phone,
    dateOfBirth: employee.dateOfBirth,
    gender: employee.gender,
    address: employee.address,
    department: employee.department,
    position: employee.position,
    manager: employee.manager
      ? { id: employee.manager.id, firstName: employee.manager.user.firstName, lastName: employee.manager.user.lastName }
      : null,
    joiningDate: employee.joiningDate,
    employmentType: employee.employmentType,
    salary: employee.salary ? employee.salary.toString() : null,
    status: employee.status,
    profilePictureUrl: employee.profilePictureUrl,
    createdAt: employee.createdAt,
  };
}

export const employeeService = {
  async list(query: ListEmployeesQuery, requester: { userId: string; role: Role }): Promise<PaginatedResult<EmployeeDto>> {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.department) {
      where.departmentId = query.department;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (requester.role === 'MANAGER') {
      where.managerId = await resolveEmployeeId(requester.userId);
    }

    const orderBy: Prisma.EmployeeOrderByWithRelationInput =
      query.sortBy === 'firstName' || query.sortBy === 'lastName' || query.sortBy === 'email'
        ? { user: { [query.sortBy]: query.sortOrder } }
        : { [query.sortBy]: query.sortOrder };

    const { items, total } = await employeeRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
      orderBy,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async options(): Promise<{ id: string; name: string }[]> {
    const employees = await employeeRepository.findOptions();
    return employees.map((e) => ({ id: e.id, name: `${e.user.firstName} ${e.user.lastName}` }));
  },

  async getById(id: string, requester: { userId: string; role: Role }): Promise<EmployeeDto> {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }

    if (requester.role === 'MANAGER') {
      const managerEmployeeId = await resolveEmployeeId(requester.userId);
      if (employee.managerId !== managerEmployeeId && employee.id !== managerEmployeeId) {
        throw ApiError.forbidden('You can only view employees on your team');
      }
    }

    return toDto(employee);
  },

  async create(input: CreateEmployeeInput): Promise<EmployeeDto> {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(DEFAULT_EMPLOYEE_PASSWORD);

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          role: 'EMPLOYEE',
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          phone: input.phone || null,
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          address: input.address || null,
          departmentId: input.departmentId || null,
          position: input.position || null,
          managerId: input.managerId || null,
          joiningDate: input.joiningDate ?? null,
          employmentType: input.employmentType,
          salary: input.salary ?? null,
          status: input.status,
          profilePictureUrl: input.profilePictureUrl || null,
        },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
          department: { select: { id: true, name: true } },
          manager: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      });
    });

    return toDto(employee);
  },

  async update(id: string, input: UpdateEmployeeInput): Promise<EmployeeDto> {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Employee not found');
    }

    if (input.managerId === id) {
      throw ApiError.badRequest('An employee cannot be their own manager');
    }

    const employee = await employeeRepository.update(id, {
      ...(input.firstName !== undefined || input.lastName !== undefined
        ? {
            user: {
              update: {
                ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
                ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
              },
            },
          }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.dateOfBirth !== undefined ? { dateOfBirth: input.dateOfBirth } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.departmentId !== undefined
        ? input.departmentId
          ? { department: { connect: { id: input.departmentId } } }
          : { department: { disconnect: true } }
        : {}),
      ...(input.position !== undefined ? { position: input.position || null } : {}),
      ...(input.managerId !== undefined
        ? input.managerId
          ? { manager: { connect: { id: input.managerId } } }
          : { manager: { disconnect: true } }
        : {}),
      ...(input.joiningDate !== undefined ? { joiningDate: input.joiningDate } : {}),
      ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
      ...(input.salary !== undefined ? { salary: input.salary } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.profilePictureUrl !== undefined ? { profilePictureUrl: input.profilePictureUrl || null } : {}),
    });

    return toDto(employee);
  },

  async delete(id: string): Promise<void> {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Employee not found');
    }
    // Deleting the User cascades to the Employee row (see schema.prisma);
    // offboarding an employee also revokes their login.
    await userRepository.delete(existing.userId);
  },
};

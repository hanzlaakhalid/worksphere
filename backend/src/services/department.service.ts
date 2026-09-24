import { departmentRepository, DepartmentWithRelations } from '../repositories/department.repository';
import { ApiError } from '../lib/apiError';
import type { CreateDepartmentInput, UpdateDepartmentInput } from '../validation/department.validation';
import type { DepartmentDto } from '../types/department.types';

function toDto(department: DepartmentWithRelations): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    description: department.description,
    manager: department.manager
      ? {
          id: department.manager.id,
          firstName: department.manager.user.firstName,
          lastName: department.manager.user.lastName,
        }
      : null,
    employeeCount: department._count.employees,
    createdAt: department.createdAt,
  };
}

export const departmentService = {
  async list(): Promise<DepartmentDto[]> {
    const departments = await departmentRepository.findAll();
    return departments.map(toDto);
  },

  async getById(id: string): Promise<DepartmentDto> {
    const department = await departmentRepository.findById(id);
    if (!department) {
      throw ApiError.notFound('Department not found');
    }
    return toDto(department);
  },

  async create(input: CreateDepartmentInput): Promise<DepartmentDto> {
    const existing = await departmentRepository.findByName(input.name);
    if (existing) {
      throw ApiError.conflict('A department with this name already exists');
    }

    const department = await departmentRepository.create({
      name: input.name,
      description: input.description || null,
      ...(input.managerId ? { manager: { connect: { id: input.managerId } } } : {}),
    });
    return toDto(department);
  },

  async update(id: string, input: UpdateDepartmentInput): Promise<DepartmentDto> {
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Department not found');
    }

    if (input.name && input.name !== existing.name) {
      const nameTaken = await departmentRepository.findByName(input.name);
      if (nameTaken) {
        throw ApiError.conflict('A department with this name already exists');
      }
    }

    const department = await departmentRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.managerId !== undefined
        ? input.managerId
          ? { manager: { connect: { id: input.managerId } } }
          : { manager: { disconnect: true } }
        : {}),
    });
    return toDto(department);
  },

  async delete(id: string): Promise<void> {
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Department not found');
    }
    await departmentRepository.delete(id);
  },
};

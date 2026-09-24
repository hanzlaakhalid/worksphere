import { employeeRepository } from '../repositories/employee.repository';
import { prisma } from '../lib/prisma';
import { ApiError } from '../lib/apiError';

export async function resolveEmployeeId(userId: string): Promise<string> {
  const employee = await employeeRepository.findByUserId(userId);
  if (!employee) {
    throw ApiError.notFound('No employee record is linked to your account yet');
  }
  return employee.id;
}

export async function resolveTeamEmployeeIds(managerEmployeeId: string): Promise<string[]> {
  const reports = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId },
    select: { id: true },
  });
  return reports.map((r) => r.id);
}

import type { Role } from '@prisma/client';
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

export async function resolveUserIdByEmployeeId(employeeId: string): Promise<string | null> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { userId: true } });
  return employee?.userId ?? null;
}

export async function resolveUserForEmployeeId(employeeId: string): Promise<{ userId: string; role: Role } | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { userId: true, user: { select: { role: true } } },
  });
  return employee ? { userId: employee.userId, role: employee.user.role } : null;
}

const ROLE_BASE_PATH: Record<Role, string> = {
  ADMIN: '/admin',
  HR_MANAGER: '/hr',
  MANAGER: '/manager',
  EMPLOYEE: '/employee',
};

/**
 * Builds a role-prefixed deep link for a notification, falling back to the
 * recipient's dashboard when their role doesn't have that route (e.g. leave
 * and performance aren't in ADMIN/HR_MANAGER's nav).
 */
export function notificationLink(role: Role, path: 'leave' | 'performance' | 'payroll' | 'documents' | 'announcements'): string {
  const base = ROLE_BASE_PATH[role];
  const hasRoute =
    path === 'documents' || path === 'announcements' || role === 'EMPLOYEE' || role === 'MANAGER';
  return hasRoute ? `${base}/${path}` : `${base}/dashboard`;
}

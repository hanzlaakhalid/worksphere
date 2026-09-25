import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { resolveEmployeeId, resolveTeamEmployeeIds } from './employee-scope.util';
import type { SearchResults } from '../types/search.types';

const RESULT_LIMIT = 5;

async function searchEmployees(q: string, requester: { userId: string; role: Role }) {
  if (requester.role === 'EMPLOYEE') return [];

  const managerScope =
    requester.role === 'MANAGER' ? await resolveTeamEmployeeIds(await resolveEmployeeId(requester.userId)) : null;

  const employees = await prisma.employee.findMany({
    where: {
      ...(managerScope ? { id: { in: managerScope } } : {}),
      user: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
    },
    take: RESULT_LIMIT,
    select: {
      id: true,
      sequence: true,
      user: { select: { firstName: true, lastName: true } },
      department: { select: { name: true } },
    },
  });

  return employees.map((e) => ({
    id: e.id,
    employeeCode: `EMP-${String(e.sequence).padStart(4, '0')}`,
    firstName: e.user.firstName,
    lastName: e.user.lastName,
    department: e.department?.name ?? null,
  }));
}

async function searchDepartments(q: string, requester: { role: Role }) {
  // MANAGER can read departments (for filter dropdowns) but has no departments page to link to.
  if (requester.role !== 'ADMIN' && requester.role !== 'HR_MANAGER') return [];

  const departments = await prisma.department.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    take: RESULT_LIMIT,
    select: { id: true, name: true },
  });

  return departments;
}

async function searchJobs(q: string, requester: { role: Role }) {
  // ADMIN can call the jobs API but has no Recruitment nav entry to link to.
  if (requester.role !== 'HR_MANAGER') return [];

  const jobs = await prisma.job.findMany({
    where: { title: { contains: q, mode: 'insensitive' } },
    take: RESULT_LIMIT,
    select: { id: true, title: true, status: true },
  });

  return jobs;
}

async function searchAnnouncements(q: string, requester: { role: Role }) {
  const canSeeAll = requester.role === 'ADMIN' || requester.role === 'HR_MANAGER';
  const now = new Date();

  const textMatch: Prisma.AnnouncementWhereInput = {
    OR: [{ title: { contains: q, mode: 'insensitive' } }, { content: { contains: q, mode: 'insensitive' } }],
  };

  const where: Prisma.AnnouncementWhereInput = canSeeAll
    ? textMatch
    : { AND: [textMatch, { publishedAt: { lte: now } }, { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }] };

  const announcements = await prisma.announcement.findMany({
    where,
    take: RESULT_LIMIT,
    select: { id: true, title: true },
  });

  return announcements;
}

export const searchService = {
  async search(q: string, requester: { userId: string; role: Role }): Promise<SearchResults> {
    const [employees, departments, jobs, announcements] = await Promise.all([
      searchEmployees(q, requester),
      searchDepartments(q, requester),
      searchJobs(q, requester),
      searchAnnouncements(q, requester),
    ]);

    return { employees, departments, jobs, announcements };
  },
};

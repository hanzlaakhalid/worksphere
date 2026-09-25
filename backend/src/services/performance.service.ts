import type { Prisma, Role } from '@prisma/client';
import { performanceRepository, PerformanceReviewWithRelations } from '../repositories/performance.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { resolveEmployeeId } from './employee-scope.util';
import { ApiError } from '../lib/apiError';
import type {
  CreatePerformanceReviewInput,
  ListPerformanceQuery,
  UpdatePerformanceReviewInput,
} from '../validation/performance.validation';
import type { PaginatedResult, PerformanceReviewDto } from '../types/performance.types';

function toDto(review: PerformanceReviewWithRelations): PerformanceReviewDto {
  const toSummary = (e: PerformanceReviewWithRelations['employee']) => ({
    id: e.id,
    employeeCode: `EMP-${String(e.sequence).padStart(4, '0')}`,
    firstName: e.user.firstName,
    lastName: e.user.lastName,
  });

  return {
    id: review.id,
    employee: toSummary(review.employee),
    reviewer: toSummary(review.reviewer),
    reviewPeriod: review.reviewPeriod,
    overallRating: review.overallRating,
    goals: review.goals,
    achievements: review.achievements,
    strengths: review.strengths,
    areasForImprovement: review.areasForImprovement,
    managerComments: review.managerComments,
    createdAt: review.createdAt,
  };
}

export const performanceService = {
  async list(
    query: ListPerformanceQuery,
    requester: { userId: string; role: Role },
  ): Promise<PaginatedResult<PerformanceReviewDto>> {
    const where: Prisma.PerformanceReviewWhereInput = {};

    if (requester.role === 'EMPLOYEE') {
      where.employeeId = await resolveEmployeeId(requester.userId);
    } else if (requester.role === 'MANAGER') {
      where.reviewerId = await resolveEmployeeId(requester.userId);
    } else if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    const { items, total } = await performanceRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreatePerformanceReviewInput, requester: { userId: string }): Promise<PerformanceReviewDto> {
    const reviewerId = await resolveEmployeeId(requester.userId);

    const employee = await employeeRepository.findById(input.employeeId);
    if (!employee) {
      throw ApiError.notFound('Employee not found');
    }
    if (employee.managerId !== reviewerId) {
      throw ApiError.forbidden('You can only write reviews for employees on your team');
    }

    const review = await performanceRepository.create({
      employee: { connect: { id: input.employeeId } },
      reviewer: { connect: { id: reviewerId } },
      reviewPeriod: input.reviewPeriod,
      overallRating: input.overallRating,
      goals: input.goals,
      achievements: input.achievements,
      strengths: input.strengths,
      areasForImprovement: input.areasForImprovement,
      managerComments: input.managerComments,
    });

    return toDto(review);
  },

  async update(
    id: string,
    input: UpdatePerformanceReviewInput,
    requester: { userId: string },
  ): Promise<PerformanceReviewDto> {
    const existing = await performanceRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Performance review not found');
    }

    const reviewerId = await resolveEmployeeId(requester.userId);
    if (existing.reviewerId !== reviewerId) {
      throw ApiError.forbidden('You can only edit reviews you wrote');
    }

    const review = await performanceRepository.update(id, input);
    return toDto(review);
  },
};

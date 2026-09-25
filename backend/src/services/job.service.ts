import type { Prisma } from '@prisma/client';
import { jobRepository, JobWithRelations } from '../repositories/job.repository';
import { ApiError } from '../lib/apiError';
import type { CreateJobInput, ListJobsQuery, UpdateJobInput } from '../validation/job.validation';
import type { JobDto, PaginatedResult } from '../types/recruitment.types';

function toDto(job: JobWithRelations): JobDto {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    employmentType: job.employmentType,
    salaryRangeMin: job.salaryRangeMin ? job.salaryRangeMin.toString() : null,
    salaryRangeMax: job.salaryRangeMax ? job.salaryRangeMax.toString() : null,
    status: job.status,
    applicationCount: job._count.applications,
    createdAt: job.createdAt,
  };
}

export const jobService = {
  async list(query: ListJobsQuery): Promise<PaginatedResult<JobDto>> {
    const where: Prisma.JobWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }

    const { items, total } = await jobRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async listOpenOptions(): Promise<{ id: string; title: string }[]> {
    const { items } = await jobRepository.findMany({ skip: 0, take: 100, where: { status: 'OPEN' } });
    return items.map((j) => ({ id: j.id, title: j.title }));
  },

  async getById(id: string): Promise<JobDto> {
    const job = await jobRepository.findById(id);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }
    return toDto(job);
  },

  async create(input: CreateJobInput, requester: { employeeId: string | null }): Promise<JobDto> {
    const job = await jobRepository.create({
      title: input.title,
      ...(input.departmentId ? { department: { connect: { id: input.departmentId } } } : {}),
      description: input.description,
      requirements: input.requirements,
      location: input.location,
      employmentType: input.employmentType,
      salaryRangeMin: input.salaryRangeMin ?? null,
      salaryRangeMax: input.salaryRangeMax ?? null,
      status: input.status,
      ...(requester.employeeId ? { postedBy: { connect: { id: requester.employeeId } } } : {}),
    });
    return toDto(job);
  },

  async update(id: string, input: UpdateJobInput): Promise<JobDto> {
    const existing = await jobRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Job not found');
    }

    const job = await jobRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.departmentId !== undefined
        ? input.departmentId
          ? { department: { connect: { id: input.departmentId } } }
          : { department: { disconnect: true } }
        : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.requirements !== undefined ? { requirements: input.requirements } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
      ...(input.salaryRangeMin !== undefined ? { salaryRangeMin: input.salaryRangeMin } : {}),
      ...(input.salaryRangeMax !== undefined ? { salaryRangeMax: input.salaryRangeMax } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });
    return toDto(job);
  },

  async delete(id: string): Promise<void> {
    const existing = await jobRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Job not found');
    }
    await jobRepository.delete(id);
  },
};

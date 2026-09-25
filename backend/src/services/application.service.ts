import type { ApplicationStatus, Prisma } from '@prisma/client';
import { applicationRepository, ApplicationWithRelations } from '../repositories/application.repository';
import { jobRepository } from '../repositories/job.repository';
import { ApiError } from '../lib/apiError';
import type {
  CreateApplicationInput,
  CreateInterviewInput,
  ListApplicationsQuery,
} from '../validation/application.validation';
import type { ApplicationDto, PaginatedResult, RecruitmentStatsDto } from '../types/recruitment.types';

const ALL_STATUSES: ApplicationStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];

function toDto(application: ApplicationWithRelations): ApplicationDto {
  return {
    id: application.id,
    job: application.job,
    applicant: {
      id: application.applicant.id,
      firstName: application.applicant.firstName,
      lastName: application.applicant.lastName,
      email: application.applicant.email,
      phone: application.applicant.phone,
      resumeUrl: application.applicant.resumeUrl,
    },
    status: application.status,
    appliedAt: application.appliedAt,
    interviews: application.interviews.map((i) => ({
      id: i.id,
      scheduledAt: i.scheduledAt,
      interviewer: i.interviewer
        ? { id: i.interviewer.id, firstName: i.interviewer.user.firstName, lastName: i.interviewer.user.lastName }
        : null,
      notes: i.notes,
      createdAt: i.createdAt,
    })),
  };
}

export const applicationService = {
  async list(query: ListApplicationsQuery): Promise<PaginatedResult<ApplicationDto>> {
    const where: Prisma.ApplicationWhereInput = {};
    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;

    const { items, total } = await applicationRepository.findMany({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      where,
    });

    return { data: items.map(toDto), page: query.page, pageSize: query.pageSize, total };
  },

  async create(input: CreateApplicationInput): Promise<ApplicationDto> {
    const job = await jobRepository.findById(input.jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    let applicant = await applicationRepository.findApplicantByEmail(input.email);
    if (!applicant) {
      applicant = await applicationRepository.createApplicant({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        resumeUrl: input.resumeUrl || null,
      });
    }

    try {
      const application = await applicationRepository.create({
        job: { connect: { id: input.jobId } },
        applicant: { connect: { id: applicant.id } },
      });
      return toDto(application);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw ApiError.conflict('This applicant has already applied to this job');
      }
      throw error;
    }
  },

  async updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationDto> {
    const existing = await applicationRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Application not found');
    }
    const application = await applicationRepository.updateStatus(id, status);
    return toDto(application);
  },

  async addInterview(id: string, input: CreateInterviewInput): Promise<ApplicationDto> {
    const existing = await applicationRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Application not found');
    }

    await applicationRepository.addInterview(id, {
      scheduledAt: input.scheduledAt,
      notes: input.notes || null,
      ...(input.interviewerId ? { interviewer: { connect: { id: input.interviewerId } } } : {}),
    });

    const updated = await applicationRepository.findById(id);
    return toDto(updated!);
  },

  async stats(): Promise<RecruitmentStatsDto> {
    const [openJobs, totalApplicants, grouped] = await Promise.all([
      jobRepository.countOpen(),
      applicationRepository.countApplicants(),
      applicationRepository.countByStatus(),
    ]);

    const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<
      Record<ApplicationStatus, number>
    >;

    const byStatus = Object.fromEntries(ALL_STATUSES.map((status) => [status, counts[status] ?? 0])) as Record<
      ApplicationStatus,
      number
    >;

    return { openJobs, totalApplicants, byStatus };
  },
};

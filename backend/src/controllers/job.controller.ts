import { Request, Response } from 'express';
import { jobService } from '../services/job.service';
import { requireParam } from '../lib/params';
import { resolveEmployeeId } from '../services/employee-scope.util';
import { ApiError } from '../lib/apiError';
import type { CreateJobInput, ListJobsQuery, UpdateJobInput } from '../validation/job.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const jobController = {
  async list(req: Request, res: Response) {
    const query = (req.validated?.query ?? {}) as ListJobsQuery;
    const result = await jobService.list(query);
    res.status(200).json(result);
  },

  async options(_req: Request, res: Response) {
    const options = await jobService.listOpenOptions();
    res.status(200).json({ data: options });
  },

  async getById(req: Request, res: Response) {
    const job = await jobService.getById(requireParam(req, 'id'));
    res.status(200).json({ data: job });
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const employeeId = await resolveEmployeeId(user.sub).catch(() => null);
    const job = await jobService.create(req.body as CreateJobInput, { employeeId });
    res.status(201).json({ data: job });
  },

  async update(req: Request, res: Response) {
    const job = await jobService.update(requireParam(req, 'id'), req.body as UpdateJobInput);
    res.status(200).json({ data: job });
  },

  async remove(req: Request, res: Response) {
    await jobService.delete(requireParam(req, 'id'));
    res.status(204).send();
  },
};

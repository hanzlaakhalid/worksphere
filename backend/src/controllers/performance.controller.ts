import { Request, Response } from 'express';
import { performanceService } from '../services/performance.service';
import { ApiError } from '../lib/apiError';
import { requireParam } from '../lib/params';
import type {
  CreatePerformanceReviewInput,
  ListPerformanceQuery,
  UpdatePerformanceReviewInput,
} from '../validation/performance.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const performanceController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListPerformanceQuery;
    const result = await performanceService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const review = await performanceService.create(req.body as CreatePerformanceReviewInput, { userId: user.sub });
    res.status(201).json({ data: review });
  },

  async update(req: Request, res: Response) {
    const user = requireUser(req);
    const review = await performanceService.update(requireParam(req, 'id'), req.body as UpdatePerformanceReviewInput, {
      userId: user.sub,
    });
    res.status(200).json({ data: review });
  },
};

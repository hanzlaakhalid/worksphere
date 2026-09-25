import { Request, Response } from 'express';
import { applicationService } from '../services/application.service';
import { requireParam } from '../lib/params';
import type {
  CreateApplicationInput,
  CreateInterviewInput,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from '../validation/application.validation';

export const applicationController = {
  async list(req: Request, res: Response) {
    const query = (req.validated?.query ?? {}) as ListApplicationsQuery;
    const result = await applicationService.list(query);
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const application = await applicationService.create(req.body as CreateApplicationInput);
    res.status(201).json({ data: application });
  },

  async updateStatus(req: Request, res: Response) {
    const { status } = req.body as UpdateApplicationStatusInput;
    const application = await applicationService.updateStatus(requireParam(req, 'id'), status);
    res.status(200).json({ data: application });
  },

  async addInterview(req: Request, res: Response) {
    const application = await applicationService.addInterview(requireParam(req, 'id'), req.body as CreateInterviewInput);
    res.status(201).json({ data: application });
  },

  async stats(_req: Request, res: Response) {
    const stats = await applicationService.stats();
    res.status(200).json({ data: stats });
  },
};

import { Request, Response } from 'express';
import { announcementService } from '../services/announcement.service';
import { requireParam } from '../lib/params';
import { ApiError } from '../lib/apiError';
import type { CreateAnnouncementInput, ListAnnouncementsQuery, UpdateAnnouncementInput } from '../validation/announcement.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const announcementController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListAnnouncementsQuery;
    const result = await announcementService.list(query, { role: user.role });
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const announcement = await announcementService.create(req.body as CreateAnnouncementInput, { userId: user.sub });
    res.status(201).json({ data: announcement });
  },

  async update(req: Request, res: Response) {
    const announcement = await announcementService.update(requireParam(req, 'id'), req.body as UpdateAnnouncementInput);
    res.status(200).json({ data: announcement });
  },

  async remove(req: Request, res: Response) {
    await announcementService.delete(requireParam(req, 'id'));
    res.status(204).send();
  },
};

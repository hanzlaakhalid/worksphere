import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { requireParam } from '../lib/params';
import { ApiError } from '../lib/apiError';
import type { ListNotificationsQuery } from '../validation/notification.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const notificationController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListNotificationsQuery;
    const result = await notificationService.list(query, { userId: user.sub });
    res.status(200).json(result);
  },

  async unreadCount(req: Request, res: Response) {
    const user = requireUser(req);
    const count = await notificationService.unreadCount(user.sub);
    res.status(200).json({ data: { count } });
  },

  async markRead(req: Request, res: Response) {
    const user = requireUser(req);
    const notification = await notificationService.markRead(requireParam(req, 'id'), { userId: user.sub });
    res.status(200).json({ data: notification });
  },

  async markAllRead(req: Request, res: Response) {
    const user = requireUser(req);
    await notificationService.markAllRead(user.sub);
    res.status(204).send();
  },
};

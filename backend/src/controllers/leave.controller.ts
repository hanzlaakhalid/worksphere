import { Request, Response } from 'express';
import { leaveService } from '../services/leave.service';
import { ApiError } from '../lib/apiError';
import { requireParam } from '../lib/params';
import type { CreateLeaveInput, ListLeavesQuery, RejectLeaveInput } from '../validation/leave.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const leaveController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListLeavesQuery;
    const result = await leaveService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const leave = await leaveService.create(req.body as CreateLeaveInput, { userId: user.sub });
    res.status(201).json({ data: leave });
  },

  async approve(req: Request, res: Response) {
    const user = requireUser(req);
    const leave = await leaveService.approve(requireParam(req, 'id'), { userId: user.sub, role: user.role });
    res.status(200).json({ data: leave });
  },

  async reject(req: Request, res: Response) {
    const user = requireUser(req);
    const leave = await leaveService.reject(requireParam(req, 'id'), req.body as RejectLeaveInput, {
      userId: user.sub,
      role: user.role,
    });
    res.status(200).json({ data: leave });
  },
};

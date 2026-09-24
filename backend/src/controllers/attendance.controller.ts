import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { ApiError } from '../lib/apiError';
import type { ListAttendanceQuery } from '../validation/attendance.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const attendanceController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListAttendanceQuery;
    const result = await attendanceService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async statsToday(req: Request, res: Response) {
    const user = requireUser(req);
    const stats = await attendanceService.statsToday({ userId: user.sub, role: user.role });
    res.status(200).json({ data: stats });
  },
};

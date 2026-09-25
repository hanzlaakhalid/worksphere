import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { ApiError } from '../lib/apiError';
import type { AttendanceTrendQuery, EmployeeGrowthQuery } from '../validation/dashboard.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const dashboardController = {
  async employeeSummary(req: Request, res: Response) {
    const user = requireUser(req);
    const data = await dashboardService.getEmployeeSummary({ userId: user.sub, role: user.role });
    res.status(200).json({ data });
  },

  async employeeGrowth(req: Request, res: Response) {
    const query = (req.validated?.query ?? {}) as EmployeeGrowthQuery;
    const data = await dashboardService.getEmployeeGrowth(query.months);
    res.status(200).json({ data });
  },

  async leaveSummary(req: Request, res: Response) {
    const user = requireUser(req);
    const data = await dashboardService.getLeaveSummary({ userId: user.sub, role: user.role });
    res.status(200).json({ data });
  },

  async attendanceTrend(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as AttendanceTrendQuery;
    const data = await dashboardService.getAttendanceTrend(query.days, { userId: user.sub, role: user.role });
    res.status(200).json({ data });
  },

  async payrollSummary(_req: Request, res: Response) {
    const data = await dashboardService.getPayrollSummary();
    res.status(200).json({ data });
  },
};

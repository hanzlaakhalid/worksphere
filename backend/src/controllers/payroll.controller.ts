import { Request, Response } from 'express';
import { payrollService } from '../services/payroll.service';
import { ApiError } from '../lib/apiError';
import { requireParam } from '../lib/params';
import type { CreatePayrollInput, ListPayrollQuery, UpdatePayrollInput } from '../validation/payroll.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const payrollController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListPayrollQuery;
    const result = await payrollService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const payroll = await payrollService.create(req.body as CreatePayrollInput);
    res.status(201).json({ data: payroll });
  },

  async update(req: Request, res: Response) {
    const payroll = await payrollService.update(requireParam(req, 'id'), req.body as UpdatePayrollInput);
    res.status(200).json({ data: payroll });
  },

  async remove(req: Request, res: Response) {
    await payrollService.delete(requireParam(req, 'id'));
    res.status(204).send();
  },
};

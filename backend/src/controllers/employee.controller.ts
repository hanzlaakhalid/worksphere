import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import { ApiError } from '../lib/apiError';
import { requireParam } from '../lib/params';
import type { CreateEmployeeInput, ListEmployeesQuery, UpdateEmployeeInput } from '../validation/employee.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const employeeController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListEmployeesQuery;
    const result = await employeeService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async options(_req: Request, res: Response) {
    const options = await employeeService.options();
    res.status(200).json({ data: options });
  },

  async getById(req: Request, res: Response) {
    const user = requireUser(req);
    const employee = await employeeService.getById(requireParam(req, 'id'), { userId: user.sub, role: user.role });
    res.status(200).json({ data: employee });
  },

  async create(req: Request, res: Response) {
    const employee = await employeeService.create(req.body as CreateEmployeeInput);
    res.status(201).json({ data: employee });
  },

  async update(req: Request, res: Response) {
    const employee = await employeeService.update(requireParam(req, 'id'), req.body as UpdateEmployeeInput);
    res.status(200).json({ data: employee });
  },

  async remove(req: Request, res: Response) {
    await employeeService.delete(requireParam(req, 'id'));
    res.status(204).send();
  },
};

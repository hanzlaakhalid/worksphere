import { Request, Response } from 'express';
import { departmentService } from '../services/department.service';
import { requireParam } from '../lib/params';
import type { CreateDepartmentInput, UpdateDepartmentInput } from '../validation/department.validation';

export const departmentController = {
  async list(_req: Request, res: Response) {
    const departments = await departmentService.list();
    res.status(200).json({ data: departments });
  },

  async getById(req: Request, res: Response) {
    const department = await departmentService.getById(requireParam(req, 'id'));
    res.status(200).json({ data: department });
  },

  async create(req: Request, res: Response) {
    const department = await departmentService.create(req.body as CreateDepartmentInput);
    res.status(201).json({ data: department });
  },

  async update(req: Request, res: Response) {
    const department = await departmentService.update(requireParam(req, 'id'), req.body as UpdateDepartmentInput);
    res.status(200).json({ data: department });
  },

  async remove(req: Request, res: Response) {
    await departmentService.delete(requireParam(req, 'id'));
    res.status(204).send();
  },
};

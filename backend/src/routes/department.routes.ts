import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createDepartmentSchema, updateDepartmentSchema } from '../validation/department.validation';

export const departmentRouter = Router();

departmentRouter.use(authenticate, authorize('ADMIN', 'HR_MANAGER'));

departmentRouter.get('/', departmentController.list);
departmentRouter.get('/:id', departmentController.getById);
departmentRouter.post('/', validate(createDepartmentSchema), departmentController.create);
departmentRouter.put('/:id', validate(updateDepartmentSchema), departmentController.update);
departmentRouter.delete('/:id', departmentController.remove);

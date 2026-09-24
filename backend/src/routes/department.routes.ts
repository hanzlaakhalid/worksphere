import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createDepartmentSchema, updateDepartmentSchema } from '../validation/department.validation';

export const departmentRouter = Router();

departmentRouter.use(authenticate);

// Read access is broader than write access: MANAGER can browse department
// names (e.g. to filter their team list) but cannot create/edit/delete.
departmentRouter.get('/', authorize('ADMIN', 'HR_MANAGER', 'MANAGER'), departmentController.list);
departmentRouter.get('/:id', authorize('ADMIN', 'HR_MANAGER', 'MANAGER'), departmentController.getById);
departmentRouter.post('/', authorize('ADMIN', 'HR_MANAGER'), validate(createDepartmentSchema), departmentController.create);
departmentRouter.put(
  '/:id',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(updateDepartmentSchema),
  departmentController.update,
);
departmentRouter.delete('/:id', authorize('ADMIN', 'HR_MANAGER'), departmentController.remove);

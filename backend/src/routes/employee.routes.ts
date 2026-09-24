import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createEmployeeSchema, listEmployeesQuerySchema, updateEmployeeSchema } from '../validation/employee.validation';

export const employeeRouter = Router();

employeeRouter.use(authenticate);

employeeRouter.get(
  '/',
  authorize('ADMIN', 'HR_MANAGER', 'MANAGER'),
  validate(listEmployeesQuerySchema),
  employeeController.list,
);
employeeRouter.get('/options', authorize('ADMIN', 'HR_MANAGER'), employeeController.options);
employeeRouter.get('/:id', authorize('ADMIN', 'HR_MANAGER', 'MANAGER'), employeeController.getById);
employeeRouter.post(
  '/',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(createEmployeeSchema),
  employeeController.create,
);
employeeRouter.put(
  '/:id',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(updateEmployeeSchema),
  employeeController.update,
);
employeeRouter.delete('/:id', authorize('ADMIN', 'HR_MANAGER'), employeeController.remove);

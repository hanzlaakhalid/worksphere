import { Router } from 'express';
import { payrollController } from '../controllers/payroll.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createPayrollSchema, listPayrollQuerySchema, updatePayrollSchema } from '../validation/payroll.validation';

export const payrollRouter = Router();

payrollRouter.use(authenticate);

payrollRouter.get('/', validate(listPayrollQuerySchema), payrollController.list);
payrollRouter.post('/', authorize('ADMIN', 'HR_MANAGER'), validate(createPayrollSchema), payrollController.create);
payrollRouter.put(
  '/:id',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(updatePayrollSchema),
  payrollController.update,
);
payrollRouter.delete('/:id', authorize('ADMIN', 'HR_MANAGER'), payrollController.remove);

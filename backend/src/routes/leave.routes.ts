import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createLeaveSchema, listLeavesQuerySchema, rejectLeaveSchema } from '../validation/leave.validation';

export const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.get('/', validate(listLeavesQuerySchema), leaveController.list);
leaveRouter.post('/', validate(createLeaveSchema), leaveController.create);
leaveRouter.patch('/:id/approve', authorize('ADMIN', 'HR_MANAGER', 'MANAGER'), leaveController.approve);
leaveRouter.patch(
  '/:id/reject',
  authorize('ADMIN', 'HR_MANAGER', 'MANAGER'),
  validate(rejectLeaveSchema),
  leaveController.reject,
);

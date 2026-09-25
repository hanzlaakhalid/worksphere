import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createApplicationSchema,
  createInterviewSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from '../validation/application.validation';

export const applicationRouter = Router();

applicationRouter.use(authenticate, authorize('ADMIN', 'HR_MANAGER'));

applicationRouter.get('/stats', applicationController.stats);
applicationRouter.get('/', validate(listApplicationsQuerySchema), applicationController.list);
applicationRouter.post('/', validate(createApplicationSchema), applicationController.create);
applicationRouter.patch(
  '/:id/status',
  validate(updateApplicationStatusSchema),
  applicationController.updateStatus,
);
applicationRouter.post(
  '/:id/interviews',
  validate(createInterviewSchema),
  applicationController.addInterview,
);

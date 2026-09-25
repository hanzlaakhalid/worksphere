import { Router } from 'express';
import { performanceController } from '../controllers/performance.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import {
  createPerformanceReviewSchema,
  listPerformanceQuerySchema,
  updatePerformanceReviewSchema,
} from '../validation/performance.validation';

export const performanceRouter = Router();

performanceRouter.use(authenticate);

performanceRouter.get('/', validate(listPerformanceQuerySchema), performanceController.list);
performanceRouter.post('/', authorize('MANAGER'), validate(createPerformanceReviewSchema), performanceController.create);
performanceRouter.put(
  '/:id',
  authorize('MANAGER'),
  validate(updatePerformanceReviewSchema),
  performanceController.update,
);

import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { attendanceTrendQuerySchema, employeeGrowthQuerySchema } from '../validation/dashboard.validation';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get(
  '/employee-summary',
  authorize('ADMIN', 'HR_MANAGER', 'MANAGER'),
  dashboardController.employeeSummary,
);
dashboardRouter.get(
  '/employee-growth',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(employeeGrowthQuerySchema),
  dashboardController.employeeGrowth,
);
dashboardRouter.get('/leave-summary', dashboardController.leaveSummary);
dashboardRouter.get(
  '/attendance-trend',
  authorize('ADMIN', 'HR_MANAGER', 'MANAGER'),
  validate(attendanceTrendQuerySchema),
  dashboardController.attendanceTrend,
);
dashboardRouter.get('/payroll-summary', authorize('ADMIN', 'HR_MANAGER'), dashboardController.payrollSummary);

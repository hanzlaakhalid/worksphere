import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { listAttendanceQuerySchema } from '../validation/attendance.validation';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.get('/', validate(listAttendanceQuerySchema), attendanceController.list);
attendanceRouter.get('/stats/today', authorize('ADMIN', 'HR_MANAGER', 'MANAGER'), attendanceController.statsToday);

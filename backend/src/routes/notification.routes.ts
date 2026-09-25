import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { listNotificationsQuerySchema } from '../validation/notification.validation';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', validate(listNotificationsQuerySchema), notificationController.list);
notificationRouter.get('/unread-count', notificationController.unreadCount);
notificationRouter.patch('/:id/read', notificationController.markRead);
notificationRouter.patch('/read-all', notificationController.markAllRead);

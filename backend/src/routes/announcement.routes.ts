import { Router } from 'express';
import { announcementController } from '../controllers/announcement.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createAnnouncementSchema, listAnnouncementsQuerySchema, updateAnnouncementSchema } from '../validation/announcement.validation';

export const announcementRouter = Router();

announcementRouter.use(authenticate);

announcementRouter.get('/', validate(listAnnouncementsQuerySchema), announcementController.list);
announcementRouter.post(
  '/',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(createAnnouncementSchema),
  announcementController.create,
);
announcementRouter.put(
  '/:id',
  authorize('ADMIN', 'HR_MANAGER'),
  validate(updateAnnouncementSchema),
  announcementController.update,
);
announcementRouter.delete('/:id', authorize('ADMIN', 'HR_MANAGER'), announcementController.remove);

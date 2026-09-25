import { Router } from 'express';
import { jobController } from '../controllers/job.controller';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';
import { createJobSchema, listJobsQuerySchema, updateJobSchema } from '../validation/job.validation';

export const jobRouter = Router();

jobRouter.use(authenticate, authorize('ADMIN', 'HR_MANAGER'));

jobRouter.get('/', validate(listJobsQuerySchema), jobController.list);
jobRouter.get('/options', jobController.options);
jobRouter.get('/:id', jobController.getById);
jobRouter.post('/', validate(createJobSchema), jobController.create);
jobRouter.put('/:id', validate(updateJobSchema), jobController.update);
jobRouter.delete('/:id', jobController.remove);

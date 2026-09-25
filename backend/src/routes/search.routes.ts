import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { searchQuerySchema } from '../validation/search.validation';

export const searchRouter = Router();

searchRouter.use(authenticate);

searchRouter.get('/', validate(searchQuerySchema), searchController.search);

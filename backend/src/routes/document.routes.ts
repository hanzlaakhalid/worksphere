import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { createDocumentSchema, listDocumentsQuerySchema } from '../validation/document.validation';

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.get('/', validate(listDocumentsQuerySchema), documentController.list);
documentRouter.post('/', validate(createDocumentSchema), documentController.create);
documentRouter.delete('/:id', documentController.remove);

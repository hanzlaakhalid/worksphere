import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { ApiError } from '../lib/apiError';

export const uploadRouter = Router();

uploadRouter.use(authenticate);

uploadRouter.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file was provided');
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { registerSchema, loginSchema, changePasswordSchema } from '../validation/auth.validation';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate(registerSchema), authController.register);
authRouter.post('/login', authRateLimiter, validate(loginSchema), authController.login);
authRouter.get('/me', authenticate, authController.me);
authRouter.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

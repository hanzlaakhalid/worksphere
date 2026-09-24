import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiError } from '../lib/apiError';
import type { RegisterInput, LoginInput, ChangePasswordInput } from '../validation/auth.validation';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json(result);
  },

  async me(req: Request, res: Response) {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const user = await authService.getCurrentUser(req.user.sub);
    res.status(200).json({ user });
  },

  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await authService.changePassword(req.user.sub, req.body as ChangePasswordInput);
    res.status(204).send();
  },
};

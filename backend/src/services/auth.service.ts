import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../lib/password';
import { signAccessToken } from '../lib/jwt';
import { ApiError } from '../lib/apiError';
import type { User } from '@prisma/client';
import type { RegisterInput, LoginInput, ChangePasswordInput } from '../validation/auth.validation';
import type { AuthResult, PublicUser } from '../types/auth.types';

function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, updatedAt: _updatedAt, ...publicUser } = user;
  return publicUser;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      role: 'EMPLOYEE',
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), accessToken };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    return { user: toPublicUser(user), accessToken };
  },

  async getCurrentUser(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toPublicUser(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const currentMatches = await comparePassword(input.currentPassword, user.passwordHash);
    if (!currentMatches) {
      // 400, not 401: the caller IS authenticated, they just supplied the wrong
      // current password. A 401 here would be indistinguishable from an expired
      // token and would trigger the frontend's global auto-logout interceptor.
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(input.newPassword);
    await userRepository.updatePasswordHash(userId, newPasswordHash);
  },
};

import type { Role } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { LoginDTO, AuthResponseDTO } from '../dto';
import { UserRole } from '../../domain/enums';
import { AppError } from '../../presentation/middleware/error-handler';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.isActive) {
      throw new AppError('Geçersiz kullanıcı adı veya şifre', 401);
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new AppError('Geçersiz kullanıcı adı veya şifre', 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as string }
    );

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role as UserRole,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<AuthResponseDTO['user']> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('Kullanıcı bulunamadı', 404);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role as UserRole,
    };
  }
}

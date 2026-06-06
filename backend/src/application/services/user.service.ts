import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateUserDTO, UpdateUserDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    return user;
  }

  async create(dto: CreateUserDTO) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) throw new AppError('Bu kullanıcı adı zaten alınmış', 400);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        password: hashedPassword,
        role: dto.role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDTO) {
    await this.getById(id);
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id } },
      });
      if (existing) throw new AppError('Bu kullanıcı adı zaten alınmış', 400);
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    } else {
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.user.delete({ where: { id } });
  }
}

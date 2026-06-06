import { PrismaClient } from '@prisma/client';
import { CreateShiftDTO, UpdateShiftDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class ShiftService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.shift.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getById(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
    });
    if (!shift) throw new AppError('Vardiya bulunamadı', 404);
    return shift;
  }

  async getByDate(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.shift.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(dto: CreateShiftDTO) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    return this.prisma.shift.create({
      data: {
        userId: dto.userId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        note: dto.note,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateShiftDTO) {
    await this.getById(id);
    const data: any = { ...dto };
    if (dto.date) data.date = new Date(dto.date);

    return this.prisma.shift.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true, role: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.shift.delete({ where: { id } });
  }
}

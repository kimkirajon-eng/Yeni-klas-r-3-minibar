import { PrismaClient } from '@prisma/client';
import { CreateBlockDTO, UpdateBlockDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class BlockService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.block.findMany({
      orderBy: { name: 'asc' },
      include: {
        floors: {
          orderBy: { name: 'asc' },
        },
        _count: { select: { rooms: true } },
      },
    });
  }

  async getById(id: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        floors: {
          orderBy: { name: 'asc' },
          include: {
            rooms: { orderBy: { name: 'asc' } },
          },
        },
      },
    });
    if (!block) throw new AppError('Blok bulunamadı', 404);
    return block;
  }

  async create(dto: CreateBlockDTO) {
    const existing = await this.prisma.block.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new AppError('Bu isimde bir blok zaten var', 400);
    return this.prisma.block.create({ data: { name: dto.name } });
  }

  async update(id: string, dto: UpdateBlockDTO) {
    await this.getById(id);
    if (dto.name) {
      const existing = await this.prisma.block.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) throw new AppError('Bu isimde bir blok zaten var', 400);
    }
    return this.prisma.block.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.getById(id);
    const floorCount = await this.prisma.floor.count({ where: { blockId: id } });
    if (floorCount > 0) {
      throw new AppError('Bu bloğa bağlı katlar bulunuyor. Önce katları silin.', 400);
    }
    return this.prisma.block.delete({ where: { id } });
  }
}

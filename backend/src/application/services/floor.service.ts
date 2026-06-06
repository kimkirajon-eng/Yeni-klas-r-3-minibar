import { PrismaClient } from '@prisma/client';
import { CreateFloorDTO, UpdateFloorDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class FloorService {
  constructor(private prisma: PrismaClient) {}

  async getByBlockId(blockId: string) {
    return this.prisma.floor.findMany({
      where: { blockId },
      orderBy: { name: 'asc' },
      include: {
        rooms: {
          orderBy: { name: 'asc' },
          include: {
            block: true,
            floor: true,
          },
        },
      },
    });
  }

  async getById(id: string) {
    const floor = await this.prisma.floor.findUnique({
      where: { id },
      include: {
        block: true,
        rooms: {
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!floor) throw new AppError('Kat bulunamadı', 404);
    return floor;
  }

  async create(dto: CreateFloorDTO) {
    const block = await this.prisma.block.findUnique({ where: { id: dto.blockId } });
    if (!block) throw new AppError('Blok bulunamadı', 404);

    const existing = await this.prisma.floor.findFirst({
      where: { name: dto.name, blockId: dto.blockId },
    });
    if (existing) throw new AppError('Bu blokta aynı isimde kat zaten var', 400);

    return this.prisma.floor.create({
      data: { name: dto.name, blockId: dto.blockId },
      include: { block: true },
    });
  }

  async update(id: string, dto: UpdateFloorDTO) {
    await this.getById(id);
    if (dto.name && dto.blockId) {
      const existing = await this.prisma.floor.findFirst({
        where: { name: dto.name, blockId: dto.blockId, NOT: { id } },
      });
      if (existing) throw new AppError('Bu blokta aynı isimde kat zaten var', 400);
    }
    return this.prisma.floor.update({
      where: { id },
      data: dto,
      include: { block: true },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    const roomCount = await this.prisma.room.count({ where: { floorId: id } });
    if (roomCount > 0) {
      throw new AppError('Bu kata bağlı odalar bulunuyor. Önce odaları silin.', 400);
    }
    return this.prisma.floor.delete({ where: { id } });
  }
}

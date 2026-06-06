import { PrismaClient } from '@prisma/client';
import { CreateRoomDTO, UpdateRoomDTO, BatchOccupancyDTO } from '../dto';
import { AppError } from '../../presentation/middleware/error-handler';

export class RoomService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filters?: { blockId?: string; floorId?: string }) {
    const where: any = {};
    if (filters?.blockId) where.blockId = filters.blockId;
    if (filters?.floorId) where.floorId = filters.floorId;
    return this.prisma.room.findMany({
      where,
      include: { block: true, floor: true, _count: { select: { minibarLogs: true } } },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { block: true, floor: true, minibarLogs: { include: { product: true, personnel: { select: { firstName: true, lastName: true } } }, orderBy: { performedAt: 'desc' }, take: 100 } },
    });
    if (!room) throw new AppError('Oda bulunamadı', 404);
    return room;
  }

  async create(dto: CreateRoomDTO) {
    return this.prisma.room.create({ data: dto, include: { block: true, floor: true } });
  }

  async update(id: string, dto: UpdateRoomDTO) {
    await this.getById(id);
    return this.prisma.room.update({ where: { id }, data: dto, include: { block: true, floor: true } });
  }

  async delete(id: string) {
    await this.getById(id);
    return this.prisma.room.delete({ where: { id } });
  }

  async batchUpdateOccupancy(dto: BatchOccupancyDTO) {
    await this.prisma.room.updateMany({
      where: { id: { in: dto.roomIds } },
      data: { occupancyStatus: dto.occupancyStatus },
    });
    return this.prisma.room.findMany({
      where: { id: { in: dto.roomIds } },
      include: { block: true, floor: true },
    });
  }

  async getRoomDetails() {
    return this.prisma.room.findMany({
      include: { block: true, floor: true },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getCostSummary(blockId?: string, floorId?: string) {
    const where: any = {};
    if (blockId) where.blockId = blockId;
    if (floorId) where.floorId = floorId;

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        block: true,
        floor: true,
        minibarLogs: {
          include: { product: true },
          orderBy: { performedAt: 'desc' },
        },
      },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rooms.map((room) => {
      const todayLogs = room.minibarLogs.filter((l) => l.performedAt >= today && !l.archived);
      const totalCost = room.minibarLogs.reduce((sum, l) => sum + l.quantity * l.product.price, 0);
      const todayCost = todayLogs.reduce((sum, l) => sum + l.quantity * l.product.price, 0);
      return {
        id: room.id,
        name: room.name,
        block: room.block.name,
        floor: room.floor.name,
        occupancyStatus: room.occupancyStatus,
        minibarStatus: room.minibarStatus,
        totalCost: Math.round(totalCost * 100) / 100,
        todayCost: Math.round(todayCost * 100) / 100,
        totalConsumptions: room.minibarLogs.length,
        todayConsumptions: todayLogs.length,
      };
    });
  }

  async getRoomHistory(roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { block: true, floor: true },
    });
    if (!room) throw new AppError('Oda bulunamadı', 404);

    const [statusHistories, consumptions] = await Promise.all([
      this.prisma.roomStatusHistory.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          changedBy: { select: { firstName: true, lastName: true, role: true } },
        },
      }),
      this.prisma.minibarLog.findMany({
        where: { roomId },
        orderBy: { performedAt: 'desc' },
        take: 100,
        include: {
          product: true,
          personnel: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return { room, statusHistories, consumptions };
  }
}

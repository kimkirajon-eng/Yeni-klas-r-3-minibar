import { PrismaClient } from '@prisma/client';
import { MinibarConsumptionDTO, UpdateRoomStatusDTO, DashboardStatsDTO } from '../dto';
import { MinibarStatus } from '../../domain/enums';
import { AppError } from '../../presentation/middleware/error-handler';
import { WebSocketService } from '../../infrastructure/websocket/websocket.service';

export class MinibarService {
  constructor(
    private prisma: PrismaClient,
    private wsService: WebSocketService
  ) {}

  async updateStatus(dto: UpdateRoomStatusDTO, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new AppError('Oda bulunamadı', 404);

    const oldStatus = room.minibarStatus;

    await this.prisma.roomStatusHistory.create({
      data: {
        roomId: dto.roomId,
        oldStatus,
        newStatus: dto.status,
        changedById: userId,
        note: dto.note,
      },
    });

    const updated = await this.prisma.room.update({
      where: { id: dto.roomId },
      data: {
        minibarStatus: dto.status,
        note: dto.note !== undefined ? dto.note : room.note,
      },
      include: { block: true, floor: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.wsService.broadcast('room:status-changed', {
      roomId: dto.roomId,
      room: updated,
      oldStatus,
      newStatus: dto.status,
      changedBy: user,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async recordConsumption(dto: MinibarConsumptionDTO, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new AppError('Oda bulunamadı', 404);

    const logs = [];
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new AppError(`Ürün bulunamadı: ${item.productId}`, 404);
      if (item.quantity <= 0) continue;

      const newStock = product.stock - item.quantity;
      if (newStock < 0) throw new AppError(`Yetersiz stok: ${product.name} (kalan: ${product.stock}, istenen: ${item.quantity})`, 400);

      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: newStock },
      });

      const log = await this.prisma.minibarLog.create({
        data: {
          roomId: dto.roomId,
          productId: item.productId,
          quantity: item.quantity,
          personnelId: userId,
        },
        include: { product: true, personnel: { select: { firstName: true, lastName: true } } },
      });
      logs.push(log);
    }

    await this.prisma.roomStatusHistory.create({
      data: {
        roomId: dto.roomId,
        oldStatus: room.minibarStatus,
        newStatus: MinibarStatus.COMPLETED,
        changedById: userId,
        note: dto.note,
      },
    });

    const updated = await this.prisma.room.update({
      where: { id: dto.roomId },
      data: {
        minibarStatus: MinibarStatus.COMPLETED,
        note: dto.note !== undefined ? dto.note : room.note,
      },
      include: { block: true, floor: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    this.wsService.broadcast('room:consumption-recorded', {
      roomId: dto.roomId,
      room: updated,
      items: logs,
      changedBy: user,
      timestamp: new Date().toISOString(),
    });

    return { room: updated, logs };
  }

  async getRoomHistory(roomId: string) {
    return this.prisma.roomStatusHistory.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        changedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  async getTodayLogs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.minibarLog.findMany({
      where: { performedAt: { gte: today }, archived: false },
      include: {
        room: { include: { block: true, floor: true } },
        product: true,
        personnel: { select: { firstName: true, lastName: true } },
      },
      orderBy: { performedAt: 'desc' },
    });
  }

  async getDashboardStats(): Promise<DashboardStatsDTO> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRooms, vacant, inhouse, arrival, departure, dnd, later, completed, pending, todayConsumptions, activePersonnel] =
      await Promise.all([
        this.prisma.room.count(),
        this.prisma.room.count({ where: { occupancyStatus: 'VACANT' } }),
        this.prisma.room.count({ where: { occupancyStatus: 'INHOUSE' } }),
        this.prisma.room.count({ where: { occupancyStatus: 'ARRIVAL' } }),
        this.prisma.room.count({ where: { occupancyStatus: 'DEPARTURE' } }),
        this.prisma.room.count({ where: { minibarStatus: 'DND' } }),
        this.prisma.room.count({ where: { minibarStatus: 'LATER' } }),
        this.prisma.room.count({ where: { minibarStatus: 'COMPLETED' } }),
        this.prisma.room.count({ where: { minibarStatus: 'PENDING' } }),
        this.prisma.minibarLog.count({ where: { performedAt: { gte: today }, archived: false } }),
        this.prisma.user.count({ where: { role: 'PERSONNEL', isActive: true } }),
      ]);

    return {
      totalRooms,
      vacant,
      inhouse,
      arrival,
      departure,
      dnd,
      later,
      completed,
      pending,
      todayConsumptions,
      activePersonnel,
    };
  }

  async getAllStatusHistories() {
    return this.prisma.roomStatusHistory.findMany({
      where: { archived: false },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        room: { include: { block: true, floor: true } },
        changedBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  async updateRoomNote(roomId: string, note: string | null, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Oda bulunamadı', 404);

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { note },
      include: { block: true, floor: true },
    });

    this.wsService.broadcast('room:note-updated', {
      roomId,
      note,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}

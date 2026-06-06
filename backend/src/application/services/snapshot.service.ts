import { PrismaClient } from '@prisma/client';

interface SnapshotData {
  date: string;
  rooms: {
    id: string;
    name: string;
    blockName: string;
    floorName: string;
    occupancyStatus: string;
    minibarStatus: string;
    note: string | null;
    products: { name: string; quantity: number; revenue: number }[];
    totalQuantity: number;
    totalRevenue: number;
  }[];
  totalRevenue: number;
  totalQuantity: number;
}

export class SnapshotService {
  constructor(private prisma: PrismaClient) {}

  async createSnapshot(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rooms = await this.prisma.room.findMany({
      include: {
        block: true,
        floor: true,
        minibarLogs: {
          where: { performedAt: { gte: today } },
          include: { product: true },
        },
      },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });

    const snapshotRooms = rooms.map((room) => {
      const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
      room.minibarLogs.forEach((log) => {
        if (!productMap[log.product.name]) {
          productMap[log.product.name] = { name: log.product.name, quantity: 0, revenue: 0 };
        }
        productMap[log.product.name].quantity += log.quantity;
        productMap[log.product.name].revenue += log.quantity * Number(log.product.price);
      });
      const products = Object.values(productMap);
      const totalQuantity = products.reduce((s, p) => s + p.quantity, 0);
      const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
      return {
        id: room.id,
        name: room.name,
        blockName: room.block.name,
        floorName: room.floor.name,
        occupancyStatus: room.occupancyStatus,
        minibarStatus: room.minibarStatus,
        note: room.note,
        products,
        totalQuantity,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      };
    });

    const totalRevenue = snapshotRooms.reduce((s, r) => s + r.totalRevenue, 0);
    const totalQuantity = snapshotRooms.reduce((s, r) => s + r.totalQuantity, 0);

    const data: SnapshotData = {
      date: today.toISOString(),
      rooms: snapshotRooms,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalQuantity,
    };

    const label = `Gün Sonu - ${today.toLocaleDateString('tr-TR')}`;

    const snapshot = await this.prisma.daySnapshot.create({
      data: {
        label,
        date: today,
        data: JSON.stringify(data),
      },
    });

    /* Archive today's non-archived logs */
    await this.prisma.minibarLog.updateMany({
      where: { performedAt: { gte: today }, archived: false },
      data: { archived: true },
    });

    /* Archive today's status histories */
    await this.prisma.roomStatusHistory.updateMany({
      where: { createdAt: { gte: today }, archived: false },
      data: { archived: true },
    });

    /* Reset all rooms */
    await this.prisma.room.updateMany({
      data: {
        occupancyStatus: 'VACANT',
        minibarStatus: 'PENDING',
        note: null,
      },
    });

    return { id: snapshot.id, label, date: today, roomCount: rooms.length };
  }

  async listSnapshots() {
    const snapshots = await this.prisma.daySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, date: true, createdAt: true },
    });
    return snapshots;
  }

  async getSnapshot(id: string) {
    const snapshot = await this.prisma.daySnapshot.findUnique({ where: { id } });
    if (!snapshot) throw new Error('Snapshot bulunamadı');
    return { ...snapshot, data: JSON.parse(snapshot.data) };
  }

  async deleteSnapshot(id: string) {
    await this.prisma.daySnapshot.delete({ where: { id } });
  }
}

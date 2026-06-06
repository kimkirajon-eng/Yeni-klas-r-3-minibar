import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

export class BackupService {
  constructor(private prisma: PrismaClient) {}

  async exportAsJson(res: Response): Promise<void> {
    const [blocks, floors, rooms, users, products, minibarLogs, statusHistories, shifts] = await Promise.all([
      this.prisma.block.findMany(),
      this.prisma.floor.findMany(),
      this.prisma.room.findMany(),
      this.prisma.user.findMany({ select: { id: true, firstName: true, lastName: true, username: true, role: true, isActive: true, createdAt: true, updatedAt: true } }),
      this.prisma.product.findMany(),
      this.prisma.minibarLog.findMany({ include: { product: true, personnel: { select: { firstName: true, lastName: true } } } }),
      this.prisma.roomStatusHistory.findMany({ include: { changedBy: { select: { firstName: true, lastName: true } } } }),
      this.prisma.shift.findMany({ include: { user: { select: { firstName: true, lastName: true } } } }),
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      stats: {
        blocks: blocks.length,
        floors: floors.length,
        rooms: rooms.length,
        users: users.length,
        products: products.length,
        minibarLogs: minibarLogs.length,
        statusHistories: statusHistories.length,
        shifts: shifts.length,
      },
      data: { blocks, floors, rooms, users, products, minibarLogs, statusHistories, shifts },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=minibar-backup-${new Date().toISOString().split('T')[0]}.json`);
    res.json(backup);
  }

  async exportAsSqlite(res: Response): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');

    if (!fs.existsSync(dbPath)) {
      res.status(404).json({ message: 'Veritabanı dosyası bulunamadı' });
      return;
    }

    const stat = fs.statSync(dbPath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=minibar-backup-${new Date().toISOString().split('T')[0]}.db`);
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
  }
}

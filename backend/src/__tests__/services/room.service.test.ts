import { PrismaClient } from '@prisma/client';
import { RoomService } from '../../application/services/room.service';

describe('RoomService', () => {
  let prisma: PrismaClient;
  let service: RoomService;

  beforeAll(() => {
    prisma = new PrismaClient();
    service = new RoomService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should get all rooms', async () => {
    const rooms = await service.getAll();
    expect(Array.isArray(rooms)).toBe(true);
  });

  it('should get room by id', async () => {
    const rooms = await service.getAll();
    if (rooms.length > 0) {
      const room = await service.getById(rooms[0].id);
      expect(room.id).toBe(rooms[0].id);
      expect(room).toHaveProperty('name');
      expect(room).toHaveProperty('occupancyStatus');
      expect(room).toHaveProperty('minibarStatus');
    }
  });

  it('should throw on non-existent room', async () => {
    await expect(service.getById('non-existent')).rejects.toThrow('Oda bulunamadı');
  });

  it('should get room history', async () => {
    const rooms = await service.getAll();
    if (rooms.length > 0) {
      const history = await service.getRoomHistory(rooms[0].id);
      expect(history).toHaveProperty('room');
      expect(history).toHaveProperty('statusHistories');
      expect(history).toHaveProperty('consumptions');
    }
  });

  it('should get cost summary', async () => {
    const summary = await service.getCostSummary();
    expect(Array.isArray(summary)).toBe(true);
    if (summary.length > 0) {
      expect(summary[0]).toHaveProperty('totalCost');
      expect(summary[0]).toHaveProperty('todayCost');
    }
  });
});

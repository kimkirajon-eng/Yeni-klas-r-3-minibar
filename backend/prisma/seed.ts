import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed baslatiliyor...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const personnelPassword = await bcrypt.hash('personel123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Yonetici',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const personnel = await prisma.user.upsert({
    where: { username: 'personel1' },
    update: {},
    create: {
      firstName: 'Ahmet',
      lastName: 'Personel',
      username: 'personel1',
      password: personnelPassword,
      role: 'PERSONNEL',
    },
  });

  const blockA = await prisma.block.upsert({
    where: { id: 'block-a' },
    update: {},
    create: { id: 'block-a', name: 'A Blok' },
  });

  const blockB = await prisma.block.upsert({
    where: { id: 'block-b' },
    update: {},
    create: { id: 'block-b', name: 'B Blok' },
  });

  const floorA1 = await prisma.floor.upsert({
    where: { id: 'floor-a1' },
    update: {},
    create: { id: 'floor-a1', name: '1. Kat', blockId: blockA.id },
  });

  const floorA2 = await prisma.floor.upsert({
    where: { id: 'floor-a2' },
    update: {},
    create: { id: 'floor-a2', name: '2. Kat', blockId: blockA.id },
  });

  const floorB1 = await prisma.floor.upsert({
    where: { id: 'floor-b1' },
    update: {},
    create: { id: 'floor-b1', name: '1. Kat', blockId: blockB.id },
  });

  const rooms = [
    { id: 'room-a101', name: '101', floorId: floorA1.id, blockId: blockA.id, occupancyStatus: 'INHOUSE' },
    { id: 'room-a102', name: '102', floorId: floorA1.id, blockId: blockA.id, occupancyStatus: 'INHOUSE' },
    { id: 'room-a103', name: '103', floorId: floorA1.id, blockId: blockA.id, occupancyStatus: 'ARRIVAL' },
    { id: 'room-a201', name: '201', floorId: floorA2.id, blockId: blockA.id, occupancyStatus: 'DEPARTURE' },
    { id: 'room-a202', name: '202', floorId: floorA2.id, blockId: blockA.id, occupancyStatus: 'DEPARTURE_ARRIVAL' },
    { id: 'room-b101', name: '101', floorId: floorB1.id, blockId: blockB.id, occupancyStatus: 'INHOUSE' },
    { id: 'room-b102', name: '102', floorId: floorB1.id, blockId: blockB.id, occupancyStatus: 'INHOUSE' },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    });
  }

  const products = [
    { id: 'prod-cola', name: 'Kola', price: 15.00 },
    { id: 'prod-water', name: 'Su (0.5L)', price: 8.00 },
    { id: 'prod-soda', name: 'Soda', price: 10.00 },
    { id: 'prod-juice', name: 'Portakal Suyu', price: 20.00 },
    { id: 'prod-beer', name: 'Bira', price: 35.00 },
    { id: 'prod-chips', name: 'Cips', price: 15.00 },
    { id: 'prod-chocolate', name: 'Cikolata', price: 25.00 },
    { id: 'prod-nuts', name: 'Kuruyemis', price: 30.00 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  console.log('Seed tamamlandi!');
  console.log('  Admin giris: admin / admin123');
  console.log('  Personel giris: personel1 / personel123');
}

main()
  .catch((e) => {
    console.error('Seed hatasi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

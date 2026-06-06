import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const block = await prisma.block.findFirst({ where: { name: '3000' } });
  if (!block) { console.log('Block 3000 not found'); return; }

  const floor = await prisma.floor.findFirst({ where: { blockId: block.id, name: '2.Kat' } });
  if (!floor) { console.log('Floor 2.Kat not found'); return; }

  const exclude = new Set([3202, 3204]);
  const toCreate = [];
  for (let i = 3200; i <= 3246; i++) {
    if (exclude.has(i)) continue;
    const existing = await prisma.room.findFirst({ where: { name: String(i), floorId: floor.id } });
    if (!existing) toCreate.push(i);
  }

  for (const name of toCreate) {
    await prisma.room.create({
      data: { name: String(name), floorId: floor.id, blockId: block.id },
    });
    console.log(`${name} OK`);
  }
  console.log(`Done. ${toCreate.length} rooms created.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

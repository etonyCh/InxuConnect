import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Burundi...');

  const host = await prisma.user.upsert({
    where: { email: 'host@inzu.bi' },
    update: {},
    create: {
      email: 'host@inzu.bi',
      name: 'Thierry Nkurunziza',
      role: 'HOST',
      passwordHash: 'dummy',
    },
  });

  await prisma.property.deleteMany({});

  await prisma.property.createMany({
    data: [
      {
        title: 'Villa moderne à Kiriri',
        description: 'Vue sur lac Tanganyika',
        price: 150000,
        city: 'Bujumbura',
        lat: -3.3894,
        lng: 29.3889,
        ownerId: host.id,
      },
      {
        title: 'Appartement chic à Kinindo',
        description: '2 chambres, quartier calme',
        price: 65000,
        city: 'Bujumbura',
        lat: -3.4115,
        lng: 29.3562,
        ownerId: host.id,
      },
      {
        title: 'Maison à Gitega',
        description: 'Capitale politique',
        price: 45000,
        city: 'Gitega',
        lat: -3.4271,
        lng: 29.9246,
        ownerId: host.id,
      },
    ],
  });

  console.log('✅ Done');
}

main().finally(() => prisma.$disconnect());

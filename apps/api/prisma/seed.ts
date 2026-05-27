import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Nettoyage de la base de données...')
  await prisma.booking.deleteMany()
  await prisma.listingAvailability.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.amenity.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.kycRequest.deleteMany()
  await prisma.user.deleteMany()

  console.log('👤 Création des utilisateurs de test...')
  const host = await prisma.user.create({
    data: {
      id: 'user_host_1',
      email: 'host@inzu.bi',
      name: 'Jean Pierre',
      password: await bcrypt.hash('demo123', 10),
      role: 'HOST',
      phone: '+257 79 123 456',
      phoneVerified: true,
      kycStatus: 'VERIFIED'
    }
  })

  const guest = await prisma.user.create({
    data: {
      id: 'user_guest_1',
      email: 'guest@inzu.bi',
      name: 'Marie N.',
      password: await bcrypt.hash('demo123', 10),
      role: 'GUEST',
      phone: '+257 78 654 321',
      phoneVerified: true,
      kycStatus: 'VERIFIED'
    }
  })

  console.log('🎁 Création des équipements (Amenities)...')
  const generator = await prisma.amenity.create({ data: { name: 'generator' } })
  const waterTank = await prisma.amenity.create({ data: { name: 'water_tank' } })
  const starlink = await prisma.amenity.create({ data: { name: 'starlink' } })
  const kitchen = await prisma.amenity.create({ data: { name: 'kitchen' } })
  const securityGuard = await prisma.amenity.create({ data: { name: 'security_guard' } })

  console.log('🏡 Création des annonces (Listings)...')
  
  // Listing 1: Kiriri
  await prisma.listing.create({
    data: {
      id: 'prop_1',
      title: 'Villa moderne à Kiriri',
      description: 'Vue sur lac Tanganyika, 3 chambres, wifi haut débit, parking sécurisé et gardiennage.',
      price: 150000,
      city: 'Bujumbura',
      address: 'Kiriri, Avenue du Lac',
      bedrooms: 3,
      bathrooms: 2,
      ownerId: host.id,
      amenities: {
        connect: [
          { id: generator.id },
          { id: waterTank.id },
          { id: securityGuard.id },
          { id: starlink.id },
          { id: kitchen.id }
        ]
      },
      photos: {
        create: [
          { url: 'https://r2.inzuconnect.local/prop_1_1.jpg' },
          { url: 'https://r2.inzuconnect.local/prop_1_2.jpg' }
        ]
      }
    }
  })

  // Listing 2: Gitega
  await prisma.listing.create({
    data: {
      id: 'prop_2',
      title: 'Appartement Gitega Centre',
      description: 'Proche marché central, calme et sécurisé avec réserve d\'eau autonome.',
      price: 80000,
      city: 'Gitega',
      address: 'Centre ville',
      bedrooms: 2,
      bathrooms: 1,
      ownerId: host.id,
      amenities: {
        connect: [
          { id: waterTank.id },
          { id: kitchen.id }
        ]
      },
      photos: {
        create: [
          { url: 'https://r2.inzuconnect.local/prop_2_1.jpg' }
        ]
      }
    }
  })

  // Listing 3: Ngagara
  await prisma.listing.create({
    data: {
      id: 'prop_3',
      title: 'Maison familiale Ngagara',
      description: 'Quartier calme, grand jardin, 4 chambres et électricité assistée par groupe électrogène.',
      price: 120000,
      city: 'Bujumbura',
      address: 'Ngagara',
      bedrooms: 4,
      bathrooms: 2,
      ownerId: host.id,
      amenities: {
        connect: [
          { id: generator.id },
          { id: securityGuard.id },
          { id: kitchen.id }
        ]
      },
      photos: {
        create: [
          { url: 'https://r2.inzuconnect.local/prop_3_1.jpg' }
        ]
      }
    }
  })

  console.log('🌱 Seed de la base de données terminé avec succès.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

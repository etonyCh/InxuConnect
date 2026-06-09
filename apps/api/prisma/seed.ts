import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Nettoyage de la base de données...')
  // Order matters for deletion to respect foreign keys
  await prisma.message.deleteMany()
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.serviceBooking.deleteMany()
  await prisma.serviceItem.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.listingAvailability.deleteMany()
  await prisma.photo.deleteMany()
  await prisma.virtualStagingRequest.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.amenity.deleteMany()
  await prisma.kycRequest.deleteMany()
  await prisma.agentCommission.deleteMany()
  await prisma.user.deleteMany()

  console.log('👤 Création des utilisateurs de test officiels...')
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // 1. Guest
  await prisma.user.create({
    data: {
      email: 'guest@inzu.bi',
      name: 'Compte Guest',
      password: hashedPassword,
      role: 'GUEST',
      phone: '+257 78 000 001',
      phoneVerified: true,
      kycStatus: 'NONE'
    }
  })

  // 2. Host
  await prisma.user.create({
    data: {
      email: 'host@inzu.bi',
      name: 'Compte Host',
      password: hashedPassword,
      role: 'HOST',
      phone: '+257 79 000 002',
      phoneVerified: true,
      kycStatus: 'VERIFIED'
    }
  })

  // 3. Admin
  await prisma.user.create({
    data: {
      email: 'admin@inzu.bi',
      name: 'Compte Admin',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+257 71 000 003',
      phoneVerified: true,
      kycStatus: 'VERIFIED'
    }
  })

  // 4. Agent
  await prisma.user.create({
    data: {
      email: 'agent@inzu.bi',
      name: 'Compte Agent',
      password: hashedPassword,
      role: 'AGENT',
      phone: '+257 76 000 004',
      phoneVerified: true,
      kycStatus: 'VERIFIED'
    }
  })

  console.log('🌱 Seed de la base de données terminé avec succès. Seuls les 4 comptes de démo sont présents.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

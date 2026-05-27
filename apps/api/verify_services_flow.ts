import { PrismaClient, Badge, KycStatus, Role } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'

function generateToken(userId: string, role: string) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const base64Url = (str: string) => Buffer.from(str).toString('base64url')
  const tokenHeader = base64Url(JSON.stringify(header))
  const tokenPayload = base64Url(JSON.stringify({ id: userId, role: role }))
  const secret = process.env.JWT_SECRET || 'inzuconnect-jwt-secret-dev-2026'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${tokenHeader}.${tokenPayload}`)
    .digest('base64url')
  return `${tokenHeader}.${tokenPayload}.${signature}`
}

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Marketplace de Services Additionnels...')

  const guestId = 'test_guest_services'
  const hostId = 'test_host_services'
  const listingId = 'test_listing_services'
  const bookingId = 'test_booking_services'

  // 1. Nettoyage
  console.log('🧹 Nettoyage des anciennes données de test...')
  await prisma.serviceBooking.deleteMany({
    where: { bookingId }
  })
  await prisma.serviceItem.deleteMany({
    where: { listingId }
  })
  await prisma.booking.deleteMany({
    where: {
      OR: [
        { id: bookingId },
        { guestId: guestId },
        { listing: { ownerId: hostId } }
      ]
    }
  })
  await prisma.listing.deleteMany({
    where: { ownerId: hostId }
  })
  await prisma.user.deleteMany({
    where: {
      id: { in: [guestId, hostId] }
    }
  })

  // 2. Création des entités
  console.log('👤 Création du Voyageur et de l\'Hôte...')
  const host = await prisma.user.create({
    data: {
      id: hostId,
      email: 'host_services@test.com',
      name: 'Host Test Services',
      password: 'password_test_123',
      phone: '+25779333333',
      role: Role.HOST,
      kycStatus: KycStatus.VERIFIED
    }
  })

  const guest = await prisma.user.create({
    data: {
      id: guestId,
      email: 'guest_services@test.com',
      name: 'Guest Test Services',
      password: 'password_test_123',
      phone: '+25779222222',
      role: Role.GUEST
    }
  })

  console.log('🏡 Création du Logement...')
  await prisma.listing.create({
    data: {
      id: listingId,
      title: 'Maisonnette de Test Services',
      description: 'Maisonnette pour tester les services additionnels',
      price: 50000,
      city: 'Bujumbura',
      ownerId: hostId
    }
  })

  const hostToken = generateToken(hostId, 'HOST')
  const guestToken = generateToken(guestId, 'GUEST')

  // 3. Étape 1 : L'hôte crée deux services additionnels
  console.log('➡️ Étape 1 : Création des services additionnels par l\'Hôte...')
  const createService1Res = await fetch(`${API_URL}/api/listings/${listingId}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      name: 'Cuisine (igisafuriya)',
      description: 'Délicieux repas traditionnel burundais chaud préparé sur place',
      price: 15000
    })
  })

  if (!createService1Res.ok) {
    throw new Error(`Échec création service 1: ${createService1Res.status} ${await createService1Res.text()}`)
  }

  const service1Data = await createService1Res.json() as any
  const service1Id = service1Data.service.id
  console.log(`✅ Service 1 créé. ID: ${service1Id}`)

  const createService2Res = await fetch(`${API_URL}/api/listings/${listingId}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      name: 'Lessive',
      description: 'Lavage et repassage des vêtements',
      price: 8000
    })
  })

  const service2Data = await createService2Res.json() as any
  const service2Id = service2Data.service.id
  console.log(`✅ Service 2 créé. ID: ${service2Id}`)

  // 4. Étape 2 : Le voyageur liste les services
  console.log('➡️ Étape 2 : Le Voyageur récupère les services du logement...')
  const listServicesRes = await fetch(`${API_URL}/api/listings/${listingId}/services`)
  if (!listServicesRes.ok) {
    throw new Error(`Échec listage services: ${listServicesRes.status}`)
  }

  const listServices = await listServicesRes.json() as any[]
  console.log(`✅ Nombre de services récupérés: ${listServices.length} (attendu: 2)`)
  if (listServices.length !== 2) {
    throw new Error('Le nombre de services récupérés est incorrect')
  }

  // 5. Étape 3 : Réservation avec services additionnels
  console.log('➡️ Étape 3 : Réservation du logement avec les deux services additionnels...')
  
  // Calcul mathématique du prix total attendu
  // Logement : 1 nuit * 50000 = 50000 BIF
  // Lodging service fee : 50000 * 0.08 = 4000 BIF
  // Services : 15000 + 8000 = 23000 BIF
  // Services fee : 23000 * 0.05 = 1150 BIF
  // Total = 50000 + 23000 + 4000 + 1150 = 78150 BIF
  const expectedTotal = 78150

  const bookingRes = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      listingId,
      checkIn: '2026-06-10',
      checkOut: '2026-06-11',
      totalPrice: expectedTotal,
      paymentMethod: 'ECOCASH',
      phone: '+25779222222',
      serviceItemIds: [service1Id, service2Id]
    })
  })

  if (!bookingRes.ok) {
    throw new Error(`Échec création réservation: ${bookingRes.status} ${await bookingRes.text()}`)
  }

  const bookingData = await bookingRes.json() as any
  console.log(`✅ Réservation créée avec succès. ID: ${bookingData.id}, Total: ${bookingData.totalPrice} BIF`)
  if (bookingData.totalPrice !== expectedTotal) {
    throw new Error(`Le total de la réservation est incorrect: ${bookingData.totalPrice} (attendu: ${expectedTotal})`)
  }

  // Vérifier en base que les réservations de services sont bien créées au statut PENDING
  const serviceBookings = await prisma.serviceBooking.findMany({
    where: { bookingId: bookingData.id }
  })
  console.log(`✅ Nombre de réservations de services créées: ${serviceBookings.length} (attendu: 2)`)
  if (serviceBookings.length !== 2) {
    throw new Error('Les réservations de services additionnels n\'ont pas été créées !')
  }
  if (serviceBookings.some(sb => sb.status !== 'PENDING')) {
    throw new Error('Le statut initial des réservations de services n\'est pas PENDING')
  }

  // 6. Étape 4 : Webhook InTouch (Paiement) & Check-in (Confirmation des services)
  console.log('➡️ Étape 4 : Simulation de validation de paiement et check-in...')
  
  // Validation paiement
  await fetch(`${API_URL}/api/payments/mock-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: bookingData.payment.reference,
      status: 'SUCCESS'
    })
  })

  // Scan Check-in Hôte
  const checkInRes = await fetch(`${API_URL}/api/bookings/${bookingData.id}/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({})
  })

  if (!checkInRes.ok) {
    throw new Error(`Échec check-in: ${checkInRes.status} ${await checkInRes.text()}`)
  }

  console.log('✅ Check-in validé.')

  // Vérifier en base que les ServiceBooking sont CONFIRMED
  const finalServiceBookings = await prisma.serviceBooking.findMany({
    where: { bookingId: bookingData.id }
  })

  console.log(`✅ Statut des services après check-in: ${finalServiceBookings.map(sb => sb.status).join(', ')} (attendu: CONFIRMED, CONFIRMED)`)
  if (finalServiceBookings.some(sb => sb.status !== 'CONFIRMED')) {
    throw new Error('Le statut final des réservations de services n\'a pas été basculé à CONFIRMED')
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DE LA MARKETPLACE DE SERVICES SONT RÉUSSIS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

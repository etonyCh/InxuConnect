import { PrismaClient } from '@prisma/client'
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
  console.log('🚀 Démarrage du test d\'intégration Superhost & Micro-épargne...')

  const hostId = 'test_host_savings'
  const guestId = 'test_guest_savings'
  const listingId = 'test_list_savings'

  // 1. Nettoyage des anciennes données
  console.log('🧹 Nettoyage des anciennes données de test...')
  await prisma.review.deleteMany({
    where: { booking: { guestId: { in: [guestId, hostId] } } }
  })
  await prisma.review.deleteMany({
    where: { targetId: { in: [hostId, guestId] } }
  })
  await prisma.payment.deleteMany({
    where: { booking: { listing: { ownerId: hostId } } }
  })
  await prisma.serviceBooking.deleteMany({
    where: { booking: { listing: { ownerId: hostId } } }
  })
  await prisma.booking.deleteMany({
    where: { OR: [{ guestId }, { listing: { ownerId: hostId } }] }
  })
  await prisma.listing.deleteMany({
    where: { ownerId: hostId }
  })
  await prisma.user.deleteMany({
    where: { id: { in: [hostId, guestId] } }
  })

  // 2. Création des utilisateurs de test
  console.log('👤 Création de l\'hôte (KYC VERIFIED) et du guest...')
  const host = await prisma.user.create({
    data: {
      id: hostId,
      email: 'host_savings@inzu.bi',
      name: 'Host Savings',
      password: 'password123',
      phone: '+25779555555',
      role: 'HOST',
      kycStatus: 'VERIFIED',
      badge: 'VERIFIED'
    }
  })

  const guest = await prisma.user.create({
    data: {
      id: guestId,
      email: 'guest_savings@inzu.bi',
      name: 'Guest Savings',
      password: 'password123',
      phone: '+25778666666',
      role: 'GUEST',
      kycStatus: 'VERIFIED'
    }
  })

  // Création d'une annonce pour le test
  console.log('🏡 Création de l\'annonce de test...')
  const listing = await prisma.listing.create({
    data: {
      id: listingId,
      title: 'Appartement Épargne Test',
      description: 'Logement de test pour valider la micro-épargne.',
      price: 50000,
      city: 'Bujumbura',
      ownerId: hostId
    }
  })

  const hostToken = generateToken(hostId, 'HOST')
  const guestToken = generateToken(guestId, 'GUEST')

  // --- PARTIE 1 : TEST DE LA MICRO-ÉPARGNE ---
  console.log('\n--- PARTIE 1 : TEST DE LA MICRO-ÉPARGNE ---')

  // 3. Activer la micro-épargne pour l'hôte
  console.log('➡️ Activation de la micro-épargne par l\'hôte (POST /api/host/savings/toggle)...')
  const toggleRes = await fetch(`${API_URL}/api/host/savings/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({ enabled: true })
  })

  if (!toggleRes.ok) {
    throw new Error(`Échec toggle épargne: ${toggleRes.status} ${await toggleRes.text()}`)
  }
  const toggleData = await toggleRes.json() as any
  console.log(`✅ Micro-épargne activée : ${toggleData.microSavingsEnabled}`)
  if (toggleData.microSavingsEnabled !== true) {
    throw new Error('La micro-épargne n\'a pas été activée.')
  }

  // 4. Création d'une réservation payée (totalPrice = 100 000 BIF)
  console.log('➡️ Création d\'une réservation de test à 100 000 BIF...')
  const booking = await prisma.booking.create({
    data: {
      id: 'book_savings_1',
      listingId: listingId,
      guestId: guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      totalPrice: 100000,
      status: 'CONFIRMED'
    }
  })

  // Ajouter le paiement Escrowed pour pouvoir faire le check-in
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: 'ECOCASH',
      reference: 'INT-SAVINGS-TEST-1',
      amount: 100000,
      status: 'ESCROWED'
    }
  })

  // 5. Validation du check-in de l'hôte (libère le payout et déduit 10% d'épargne)
  console.log('➡️ Validation du check-in par l\'hôte (POST /api/bookings/book_savings_1/check-in)...')
  const checkInRes = await fetch(`${API_URL}/api/bookings/${booking.id}/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hostToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  if (!checkInRes.ok) {
    throw new Error(`Échec du check-in: ${checkInRes.status} ${await checkInRes.text()}`)
  }
  console.log('✅ Check-in validé.')

  // Vérifier en base que les 10% (10 000 BIF) ont été crédités sur le solde d'épargne de l'hôte
  const updatedHost = await prisma.user.findUnique({
    where: { id: hostId },
    select: { savingsBalance: true }
  })
  console.log(`💰 Solde d'épargne de l'hôte en base de données : ${updatedHost?.savingsBalance} BIF (attendu : 10 000)`)
  if (updatedHost?.savingsBalance !== 10000) {
    throw new Error(`Solde d'épargne incorrect : ${updatedHost?.savingsBalance}`)
  }

  // 6. Consulter le solde via l'API (GET /api/host/savings)
  console.log('➡️ Consultation du solde d\'épargne via l\'API (GET /api/host/savings)...')
  const getRes = await fetch(`${API_URL}/api/host/savings`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${hostToken}`
    }
  })
  if (!getRes.ok) {
    throw new Error(`Échec GET savings: ${getRes.status}`)
  }
  const getData = await getRes.json() as any
  console.log(`✅ Solde d'épargne récupéré : ${getData.savingsBalance} BIF`)
  if (getData.savingsBalance !== 10000) {
    throw new Error("Solde d'épargne retourné par l'API incorrect")
  }

  // 7. Test de retrait d'épargne (POST /api/host/savings/withdraw)
  console.log('➡️ Demande de retrait de 4 000 BIF (POST /api/host/savings/withdraw)...')
  const withdrawRes = await fetch(`${API_URL}/api/host/savings/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({ amount: 4000 })
  })

  if (!withdrawRes.ok) {
    throw new Error(`Échec retrait: ${withdrawRes.status} ${await withdrawRes.text()}`)
  }
  const withdrawData = await withdrawRes.json() as any
  console.log(`✅ Retrait réussi. Nouveau solde : ${withdrawData.savingsBalance} BIF (attendu : 6 000)`)
  if (withdrawData.savingsBalance !== 6000) {
    throw new Error(`Nouveau solde d'épargne incorrect après retrait : ${withdrawData.savingsBalance}`)
  }


  // --- PARTIE 2 : TEST DU BADGE SUPERHOST ---
  console.log('\n--- PARTIE 2 : TEST DU BADGE SUPERHOST ---')

  // 8. Créer deux autres réservations complétées pour atteindre le seuil de 3
  console.log('➡️ Création de 2 réservations complétées supplémentaires...')
  const booking2 = await prisma.booking.create({
    data: {
      id: 'book_savings_2',
      listingId: listingId,
      guestId: guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      totalPrice: 100000,
      status: 'CHECKED_IN'
    }
  })
  const booking3 = await prisma.booking.create({
    data: {
      id: 'book_savings_3',
      listingId: listingId,
      guestId: guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      totalPrice: 100000,
      status: 'CHECKED_IN'
    }
  })

  // Soumettre des avis pour révéler le double-blind sur les 3 réservations
  console.log('➡️ Soumission d\'avis (Double-blind) avec des notes de 5/5...')
  const writeDoubleBlindReview = async (bookingId: string) => {
    // 1. Avis du guest -> host
    await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guestToken}`
      },
      body: JSON.stringify({ rating: 5, comment: 'Superbe séjour !' })
    })

    // 2. Avis du host -> guest (déclenche la révélation et le recalcul)
    await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hostToken}`
      },
      body: JSON.stringify({ rating: 5, comment: 'Voyageur très propre.' })
    })
  }

  await writeDoubleBlindReview('book_savings_1')
  await writeDoubleBlindReview('book_savings_2')
  await writeDoubleBlindReview('book_savings_3')

  // Récupérer le profil public pour vérifier l'obtention du badge SUPERHOST
  console.log('➡️ Consultation des avis publics de l\'hôte pour vérifier le badge (GET /api/users/test_host_savings/reviews)...')
  const userRes = await fetch(`${API_URL}/api/users/${hostId}/reviews`)
  if (!userRes.ok) {
    throw new Error(`Échec de récupération de l'utilisateur: ${userRes.status}`)
  }
  const userData = await userRes.json() as any
  console.log(`🏅 Badge de l'hôte : ${userData.user.badge} (attendu : SUPERHOST)`)
  console.log(`📈 Moyenne de l'hôte : ${userData.averageRating} (attendue : 5.0)`)
  if (userData.user.badge !== 'SUPERHOST') {
    throw new Error('Le badge SUPERHOST n\'a pas été attribué.')
  }

  // 9. Tester la perte du badge en cas d'annulation (annulation par l'hôte d'une réservation)
  console.log('➡️ Simulation d\'une réservation annulée sur le logement de l\'hôte...')
  await prisma.booking.create({
    data: {
      id: 'book_savings_cancelled',
      listingId: listingId,
      guestId: guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      totalPrice: 100000,
      status: 'CANCELLED' // Annulé
    }
  })

  // Déclencher manuellement ou indirectement le recalcul (en postant un avis ou directement via l'import du module lib/reputation)
  console.log('➡️ Recalcul de la réputation de l\'hôte...')
  const { updateSelfReputationAndBadge } = require('./src/lib/reputation')
  const statusAfterCancellation = await updateSelfReputationAndBadge(hostId)
  console.log(`🏅 Badge de l'hôte après annulation : ${statusAfterCancellation.badge} (attendu : FIABLE car annulations > 0)`)
  if (statusAfterCancellation.badge === 'SUPERHOST') {
    throw new Error('L\'hôte a conservé le badge SUPERHOST malgré une annulation.')
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION SUPERHOST & MICRO-ÉPARGNE SONT RÉUSSIS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

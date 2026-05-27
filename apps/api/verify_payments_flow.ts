import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'
const TEST_PHONE = '+25779000000'

// Simuler la signature JWT côté hôte pour le scan
function generateHostToken() {
  const header = { alg: 'HS256', typ: 'JWT' }
  const base64Url = (str: string) => Buffer.from(str).toString('base64url')
  const tokenHeader = base64Url(JSON.stringify(header))
  const tokenPayload = base64Url(JSON.stringify({ id: 'user_host_1', role: 'HOST' }))
  const secret = process.env.JWT_SECRET || 'inzuconnect-jwt-secret-dev-2026'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${tokenHeader}.${tokenPayload}`)
    .digest('base64url')
  return `${tokenHeader}.${tokenPayload}.${signature}`
}

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Mobile Money & Escrow...');

  // 1. Nettoyage
  const existingUser = await prisma.user.findFirst({
    where: { phone: TEST_PHONE }
  })
  if (existingUser) {
    console.log('🧹 Nettoyage des réservations et utilisateur de test...');
    await prisma.payment.deleteMany({ where: { booking: { guestId: existingUser.id } } })
    await prisma.booking.deleteMany({ where: { guestId: existingUser.id } })
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  // S'assurer que le logement test 'prop_1' existe et est possédé par 'user_host_1'
  const host = await prisma.user.findUnique({ where: { id: 'user_host_1' } })
  if (!host) {
    throw new Error('Hôte de test "user_host_1" absent de la DB, re-seed requis')
  }

  const listing = await prisma.listing.findUnique({ where: { id: 'prop_1' } })
  if (!listing) {
    throw new Error('Logement de test "prop_1" absent de la DB, re-seed requis')
  }

  // 2. Inscription / Connexion du voyageur de test
  console.log('➡️ Demande d\'OTP...');
  const sendRes = await fetch(`${API_URL}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE })
  })
  if (!sendRes.ok) {
    throw new Error(`Échec envoi OTP: ${sendRes.status}`)
  }

  const traveler = await prisma.user.findFirst({ where: { phone: TEST_PHONE } })
  if (!traveler || !traveler.otpCode) {
    throw new Error('Code OTP absent de la base de données')
  }

  console.log('➡️ Validation de l\'OTP voyageur...');
  const verifyRes = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE, code: traveler.otpCode })
  })
  if (!verifyRes.ok) {
    throw new Error(`Échec validation OTP: ${verifyRes.status}`)
  }
  const verifyData = await verifyRes.json() as any
  const guestToken = verifyData.accessToken
  const guestId = verifyData.user.id

  console.log(`✅ Voyageur authentifié. ID: ${guestId}`);

  // 3. Test de création de réservation avec choix Mobile Money (POST /api/bookings)
  console.log('➡️ Création de la réservation avec EcoCash...');
  const bookingRes = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      listingId: 'prop_1',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 600000,
      paymentMethod: 'ECOCASH',
      phone: TEST_PHONE
    })
  })

  if (!bookingRes.ok) {
    throw new Error(`Échec création réservation: ${bookingRes.status} ${await bookingRes.text()}`)
  }

  const bookingData = await bookingRes.json() as any
  console.log(`✅ Réservation créée. ID: ${bookingData.id}, Statut: ${bookingData.status}`);
  if (bookingData.status !== 'PENDING') {
    throw new Error(`Statut initial invalide: ${bookingData.status}`)
  }

  const payment = bookingData.payment
  console.log(`✅ Paiement associé créé. Réf: ${payment.reference}, Statut: ${payment.status}`);
  if (payment.status !== 'PENDING' || !payment.reference.startsWith('INT-')) {
    throw new Error(`Paiement initial invalide: Réf: ${payment.reference}, Statut: ${payment.status}`)
  }

  // 4. Test d'accès direct au check-in sans paiement (doit échouer)
  console.log('🔒 Tentative de check-in avant paiement...');
  const hostToken = generateHostToken()
  const earlyCheckInRes = await fetch(`${API_URL}/api/bookings/${bookingData.id}/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hostToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })
  console.log(`🔒 Réponse check-in anticipé: ${earlyCheckInRes.status} (attendu: 400)`);
  if (earlyCheckInRes.status !== 400) {
    throw new Error(`Le check-in non payé n'a pas été rejeté: ${earlyCheckInRes.status}`)
  }
  console.log('✅ Sécurité confirmée : impossible de check-in sans paiement sécurisé.');

  // 5. Test Webhook Mock InTouch : Validation de paiement (Escrow activé)
  console.log('➡️ Envoi callback de paiement InTouch (SUCCESS)...');
  const callbackRes = await fetch(`${API_URL}/api/payments/mock-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: payment.reference,
      status: 'SUCCESS'
    })
  })

  if (!callbackRes.ok) {
    throw new Error(`Échec webhook callback: ${callbackRes.status}`)
  }
  console.log('✅ Callback InTouch traité.');

  // Vérifier en base que les fonds sont en Escrow et la réservation confirmée
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: bookingData.id },
    include: { payment: true }
  })
  console.log(`🔒 Statut Réservation après paiement: ${updatedBooking?.status} (attendu: CONFIRMED)`);
  console.log(`🔒 Statut Paiement après paiement: ${updatedBooking?.payment?.status} (attendu: ESCROWED)`);
  if (updatedBooking?.status !== 'CONFIRMED' || updatedBooking.payment?.status !== 'ESCROWED') {
    throw new Error('Les statuts post-paiement ne sont pas corrects')
  }
  console.log('✅ Escrow InzuConnect activé avec succès.');

  // 6. Test de check-in / Libération des fonds (POST /api/bookings/:id/check-in)
  console.log('➡️ Validation du check-in de l\'arrivée par l\'Hôte (Scan QR Code)...');
  const checkInRes = await fetch(`${API_URL}/api/bookings/${bookingData.id}/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hostToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  })

  if (!checkInRes.ok) {
    throw new Error(`Échec check-in: ${checkInRes.status} ${await checkInRes.text()}`)
  }

  const checkInData = await checkInRes.json() as any
  console.log(`✅ Check-in validé. Statut Réservation: ${checkInData.booking.status}`);
  
  // Vérification de la libération des fonds et de la date du virement
  const finalBooking = await prisma.booking.findUnique({
    where: { id: bookingData.id },
    include: { payment: true }
  })

  console.log(`💸 Statut final de réservation: ${finalBooking?.status} (attendu: CHECKED_IN)`);
  console.log(`💸 Statut final de paiement: ${finalBooking?.payment?.status} (attendu: PAID_OUT)`);
  console.log(`💸 Date de transfert vers le compte hôte: ${finalBooking?.payment?.payoutAt}`);

  if (finalBooking?.status !== 'CHECKED_IN' || finalBooking?.payment?.status !== 'PAID_OUT' || !finalBooking?.payment?.payoutAt) {
    throw new Error('La libération de l\'Escrow vers l\'hôte a échoué ou est incorrecte')
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION MOBILE MONEY & ESCROW SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

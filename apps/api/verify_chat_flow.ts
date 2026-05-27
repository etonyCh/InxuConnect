import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'
const TEST_PHONE = '+25779000000'

// Simuler la signature JWT côté hôte pour envoyer des réponses
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
  console.log('🚀 Démarrage du test d\'intégration Chat & Traduction...');

  // 1. Inscription / Connexion du voyageur de test et récupération de sa réservation
  console.log('➡️ Connexion du voyageur...');
  const traveler = await prisma.user.findFirst({ where: { phone: TEST_PHONE } })
  if (!traveler) {
    throw new Error('Voyageur de test absent de la DB, veuillez lancer verify_payments_flow.ts d\'abord')
  }

  // OTP send & verify
  const sendRes = await fetch(`${API_URL}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE })
  })
  const freshTraveler = await prisma.user.findUnique({ where: { id: traveler.id } })
  
  const verifyRes = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE, code: freshTraveler?.otpCode })
  })
  
  const verifyData = await verifyRes.json() as any
  const guestToken = verifyData.accessToken
  const guestId = verifyData.user.id

  // Rechercher une réservation active pour ce voyageur
  let booking = await prisma.booking.findFirst({
    where: { guestId }
  })

  if (!booking) {
    console.log('⚠️ Aucune réservation active trouvée. Création d\'une réservation temporaire...');
    booking = await prisma.booking.create({
      data: {
        listingId: 'prop_1',
        guestId,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        totalPrice: 300000,
        status: 'CONFIRMED'
      }
    })
  }

  const bookingId = booking.id
  console.log(`✅ Réservation active trouvée. ID: ${bookingId}`);

  // Nettoyage des anciens messages de cette réservation pour le test
  await prisma.message.deleteMany({ where: { bookingId } })

  const hostToken = generateHostToken()

  // 2. Test 1 : Envoi d'un message en français par le voyageur (Doit être traduit en Kirundi par le dictionnaire local)
  console.log('➡️ Voyageur envoie : "Je suis en route." (FR)...');
  const msg1Res = await fetch(`${API_URL}/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      body: 'Je suis en route.',
      lang: 'FR'
    })
  })

  if (!msg1Res.ok) {
    throw new Error(`Échec envoi message 1: ${msg1Res.status} ${await msg1Res.text()}`)
  }

  const msg1 = await msg1Res.json() as any
  console.log(`✅ Message 1 enregistré. Traduction obtenue: "${msg1.bodyTranslated}"`);
  if (msg1.bodyTranslated.toLowerCase() !== 'ndi mu nzira.') {
    throw new Error(`Traduction dictionnaire incorrecte pour 'Je suis en route.': ${msg1.bodyTranslated}`)
  }

  // 3. Test 2 : Envoi d'une réponse en Kirundi par l'Hôte (Doit être traduit en Français par le dictionnaire local)
  console.log('➡️ Hôte répond : "Nashitse." (RN)...');
  const msg2Res = await fetch(`${API_URL}/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      body: 'Nashitse.',
      lang: 'RN'
    })
  })

  if (!msg2Res.ok) {
    throw new Error(`Échec envoi message 2: ${msg2Res.status}`)
  }

  const msg2 = await msg2Res.json() as any
  console.log(`✅ Message 2 enregistré. Traduction obtenue: "${msg2.bodyTranslated}"`);
  if (msg2.bodyTranslated.toLowerCase() !== 'je suis arrivé.') {
    throw new Error(`Traduction dictionnaire incorrecte pour 'Nashitse.': ${msg2.bodyTranslated}`)
  }

  // 4. Test 3 : Envoi d'un texte libre (non dictionnaire) par le voyageur (Traduction libre / Claude)
  console.log('➡️ Voyageur envoie : "S\'il vous plaît, allumez le générateur." (FR)...');
  const msg3Res = await fetch(`${API_URL}/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      body: 'S\'il vous plaît, allumez le générateur.',
      lang: 'FR'
    })
  })

  if (!msg3Res.ok) {
    throw new Error(`Échec envoi message 3: ${msg3Res.status}`)
  }

  const msg3 = await msg3Res.json() as any
  console.log(`✅ Message 3 enregistré. Traduction obtenue: "${msg3.bodyTranslated}"`);

  // 5. Test 4 : Récupération de l'historique du chat (GET /api/bookings/:id/messages)
  console.log('➡️ Récupération de l\'historique des messages...');
  const historyRes = await fetch(`${API_URL}/api/bookings/${bookingId}/messages`, {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  })

  if (!historyRes.ok) {
    throw new Error(`Échec récupération historique: ${historyRes.status}`)
  }

  const history = await historyRes.json() as any[]
  console.log(`🔍 Nombre de messages récupérés dans l'historique: ${history.length}`);
  if (history.length !== 3) {
    throw new Error(`Nombre incorrect de messages dans l'historique: ${history.length} (attendu: 3)`)
  }

  // Vérification de la chronologie
  if (history[0].bodyOriginal !== 'Je suis en route.' || history[1].bodyOriginal !== 'Nashitse.') {
    throw new Error('L\'ordre chronologique des messages n\'est pas respecté')
  }
  console.log('✅ Ordre chronologique respecté.');

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION CHAT & TRADUCTION SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

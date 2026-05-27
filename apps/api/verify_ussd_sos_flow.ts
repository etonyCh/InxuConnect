import { PrismaClient, Badge, KycStatus } from '@prisma/client'
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
  console.log('🚀 Démarrage du test d\'intégration USSD Gateway & Bouton SOS...')

  const testPhone = '+25779999999'
  const guestId = 'test_guest_ussd_sos'
  const hostId = 'test_host_ussd_sos'
  const listingId = 'test_listing_ussd_sos'
  const bookingId = 'test_booking_ussd_sos'

  // 1. Nettoyage
  console.log('🧹 Nettoyage des anciennes données de test...')
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

  // 2. Création des entités de test
  console.log('👤 Création du Voyageur et de l\'Hôte...')
  const host = await prisma.user.create({
    data: {
      id: hostId,
      email: 'host_ussd_sos@test.com',
      name: 'Host Test USSD SOS',
      password: 'password_test_123',
      phone: '+25779888888',
      kycStatus: KycStatus.VERIFIED,
      role: 'HOST',
      badge: Badge.VERIFIED
    }
  })

  const guest = await prisma.user.create({
    data: {
      id: guestId,
      email: 'guest_ussd_sos@test.com',
      name: 'Guest Test USSD SOS',
      password: 'password_test_123',
      phone: testPhone,
      kycStatus: KycStatus.VERIFIED,
      role: 'GUEST',
      badge: Badge.VERIFIED
    }
  })

  console.log('🏡 Création du Logement...')
  await prisma.listing.create({
    data: {
      id: listingId,
      title: 'Maisonette de Test USSD SOS',
      description: 'Maisonnette pour tester l\'USSD et le SOS',
      price: 45000,
      city: 'Bujumbura',
      ownerId: hostId,
      taxiMotoDistance: 5
    }
  })

  // 3. Test de l'USSD Gateway (*303#)
  console.log('\n📱 --- TEST USSD GATEWAY (*303#) ---')

  // Étape A : Accueil USSD
  console.log('➡️ Étape A : Requête menu d\'accueil USSD...')
  const ussdMenuRes = await fetch(`${API_URL}/api/ussd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      sessionId: 'session_test_1',
      serviceCode: '*303#',
      phoneNumber: testPhone,
      text: ''
    }).toString()
  })

  if (!ussdMenuRes.ok) {
    throw new Error(`Échec appel USSD menu: ${ussdMenuRes.status}`)
  }

  const ussdMenuText = await ussdMenuRes.text()
  console.log(`💬 Réponse USSD:\n${ussdMenuText}`)
  if (!ussdMenuText.startsWith('CON Bienvenue sur InzuConnect')) {
    throw new Error(`Menu d'accueil incorrect: ${ussdMenuText}`)
  }
  console.log('✅ Menu d\'accueil validé.')

  // Étape B : Demande de Profil USSD (Option 2)
  console.log('➡️ Étape B : Requête profil utilisateur (Option 2)...')
  const ussdProfileRes = await fetch(`${API_URL}/api/ussd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      sessionId: 'session_test_2',
      serviceCode: '*303#',
      phoneNumber: testPhone,
      text: '2'
    }).toString()
  })

  const ussdProfileText = await ussdProfileRes.text()
  console.log(`💬 Réponse USSD:\n${ussdProfileText}`)
  if (!ussdProfileText.startsWith('END Profil InzuConnect')) {
    throw new Error(`Affichage profil incorrect: ${ussdProfileText}`)
  }
  if (!ussdProfileText.includes('Guest Test USSD SOS')) {
    throw new Error('Le nom d\'utilisateur n\'apparaît pas dans la réponse profil')
  }
  console.log('✅ Visualisation profil par USSD validée.')

  // Étape C : Recherche de logement - Saisie de la ville
  console.log('➡️ Étape C : Recherche de logement - Saisie de la ville (Option 1)...')
  const ussdSearch1Res = await fetch(`${API_URL}/api/ussd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      sessionId: 'session_test_3',
      serviceCode: '*303#',
      phoneNumber: testPhone,
      text: '1'
    }).toString()
  })
  const ussdSearch1Text = await ussdSearch1Res.text()
  console.log(`💬 Réponse USSD:\n${ussdSearch1Text}`)
  if (!ussdSearch1Text.startsWith('CON Dans quelle ville')) {
    throw new Error(`Étape saisie ville incorrecte: ${ussdSearch1Text}`)
  }

  // Étape D : Recherche de logement - Saisie du budget
  console.log('➡️ Étape D : Recherche de logement - Saisie du budget...')
  const ussdSearch2Res = await fetch(`${API_URL}/api/ussd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      sessionId: 'session_test_3',
      serviceCode: '*303#',
      phoneNumber: testPhone,
      text: '1*Bujumbura'
    }).toString()
  })
  const ussdSearch2Text = await ussdSearch2Res.text()
  console.log(`💬 Réponse USSD:\n${ussdSearch2Text}`)
  if (!ussdSearch2Text.startsWith('CON Ville : Bujumbura')) {
    throw new Error(`Étape saisie budget incorrecte: ${ussdSearch2Text}`)
  }

  // Étape E : Recherche de logement - Résultats & SMS
  console.log('➡️ Étape E : Recherche de logement - Soumission budget & envoi SMS...')
  const ussdSearch3Res = await fetch(`${API_URL}/api/ussd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      sessionId: 'session_test_3',
      serviceCode: '*303#',
      phoneNumber: testPhone,
      text: '1*Bujumbura*50000'
    }).toString()
  })
  const ussdSearch3Text = await ussdSearch3Res.text()
  console.log(`💬 Réponse USSD:\n${ussdSearch3Text}`)
  if (!ussdSearch3Text.startsWith('END InzuConnect :\n1 logement(s) trouvé(s)')) {
    throw new Error(`Résultat recherche incorrect: ${ussdSearch3Text}`)
  }
  console.log('✅ Recherche USSD avec succès et envoi de SMS simulé.')


  // 4. Test du Bouton SOS et Endpoint SOS
  console.log('\n🚨 --- TEST SOS EMERGENCY TRIGGER ---')

  console.log('📅 Création d\'une réservation temporaire (Statut: PENDING)...')
  const booking = await prisma.booking.create({
    data: {
      id: bookingId,
      listingId,
      guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000),
      totalPrice: 45000,
      status: 'PENDING'
    }
  })

  const guestToken = generateToken(guestId, 'GUEST')

  // SOS sur réservation PENDING doit être refusé
  console.log('🔒 Tentative de SOS sur réservation PENDING (doit échouer)...')
  const earlySosRes = await fetch(`${API_URL}/api/bookings/${bookingId}/sos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({ latitude: -3.38, longitude: 29.36 })
  })

  console.log(`🔒 Statut réponse SOS anticipé: ${earlySosRes.status} (attendu: 400)`)
  if (earlySosRes.status !== 400) {
    throw new Error(`Le SOS n'a pas été rejeté pour une réservation PENDING: ${earlySosRes.status}`)
  }
  console.log('✅ Protection SOS validée (uniquement séjours actifs).')

  // Passer le statut à CHECKED_IN
  console.log('➡️ Passage de la réservation au statut CHECKED_IN...')
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CHECKED_IN' }
  })

  // Déclencher le SOS
  console.log('➡️ Envoi d\'une alerte SOS avec coordonnées GPS...')
  const sosRes = await fetch(`${API_URL}/api/bookings/${bookingId}/sos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({ latitude: -3.3824, longitude: 29.3612 })
  })

  if (!sosRes.ok) {
    throw new Error(`Échec envoi SOS valide: ${sosRes.status} ${await sosRes.text()}`)
  }

  const sosData = await sosRes.json() as any
  console.log(`✅ SOS traité. Message: "${sosData.message}"`)
  if (!sosData.success) {
    throw new Error('Réponse SOS erronée')
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION USSD GATEWAY & SOS SONT RÉUSSIS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

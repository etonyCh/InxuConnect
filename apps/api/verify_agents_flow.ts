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
  console.log('🚀 Démarrage du test d\'intégration Portail Agent & Commissions...')

  const agentId = 'test_agent_user'
  const guestId = 'test_guest_agent_flow'
  const hostPhone = '+25779777777'
  const bookingId = 'test_booking_agent_flow'
  const otherHostId = 'test_other_host_agent_flow'

  // 1. Nettoyage
  console.log('🧹 Nettoyage des anciennes données de test...')
  await prisma.agentCommission.deleteMany({
    where: { agentId }
  })
  
  // Trouver l'hôte créé par l'agent s'il existe pour nettoyer ses listings et réservations
  const existingHost = await prisma.user.findFirst({
    where: { phone: hostPhone }
  })

  if (existingHost) {
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { guestId: guestId },
          { listing: { ownerId: existingHost.id } }
        ]
      }
    })
    await prisma.listing.deleteMany({
      where: { ownerId: existingHost.id }
    })
    await prisma.user.delete({
      where: { id: existingHost.id }
    })
  }

  await prisma.booking.deleteMany({
    where: {
      OR: [
        { id: bookingId },
        { listing: { ownerId: otherHostId } }
      ]
    }
  })
  await prisma.listing.deleteMany({
    where: { ownerId: otherHostId }
  })

  await prisma.user.deleteMany({
    where: {
      id: { in: [agentId, guestId, otherHostId] }
    }
  })

  // 2. Initialisation Agent, Voyageur, et Hôte tiers
  console.log('👤 Création de l\'Agent, du Voyageur et d\'un autre Hôte non lié...')
  const agentUser = await prisma.user.create({
    data: {
      id: agentId,
      email: 'agent@test.com',
      name: 'Agent de Test',
      password: 'password_test_123',
      phone: '+25779666666',
      role: Role.AGENT,
      kycStatus: KycStatus.VERIFIED
    }
  })

  const guestUser = await prisma.user.create({
    data: {
      id: guestId,
      email: 'guest_agent@test.com',
      name: 'Voyageur Test Agent',
      password: 'password_test_123',
      phone: '+25779555555',
      role: Role.GUEST
    }
  })

  // Autre Hôte non lié à cet agent
  const otherHost = await prisma.user.create({
    data: {
      id: otherHostId,
      email: 'other_host@test.com',
      name: 'Autre Hote Non Lie',
      password: 'password_test_123',
      phone: '+25779444444',
      role: Role.HOST
    }
  })

  const agentToken = generateToken(agentId, 'AGENT')
  const guestToken = generateToken(guestId, 'GUEST')
  const hostToken = generateToken(otherHostId, 'HOST') // Sert de simulation pour le check-in d'un hôte normal

  // 3. Étape 1 : L'Agent enregistre un Hôte sous son parrainage
  console.log('➡️ Étape 1 : L\'Agent enregistre un nouvel Hôte...')
  const registerHostRes = await fetch(`${API_URL}/api/agents/register-host`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      name: 'Hote Parraine Agent',
      email: 'hote_parraine@test.com',
      phone: hostPhone,
      password: 'password_hote_123'
    })
  })

  if (!registerHostRes.ok) {
    throw new Error(`Échec enregistrement hôte par agent: ${registerHostRes.status} ${await registerHostRes.text()}`)
  }

  const registerHostData = await registerHostRes.json() as any
  const referredHostId = registerHostData.user.id
  console.log(`✅ Hôte enregistré avec succès. ID: ${referredHostId}`)
  if (registerHostData.user.referredByAgentId !== agentId) {
    throw new Error('La relation de parrainage de l\'hôte avec l\'agent est absente !')
  }

  // 4. Étape 2 : L'Agent crée une annonce pour son Hôte géré
  console.log('➡️ Étape 2 : L\'Agent crée une annonce pour l\'Hôte parrainé...')
  const createListingRes = await fetch(`${API_URL}/api/agents/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      title: 'Appartement Onboarde par Agent',
      description: 'Superbe appartement géré par l\'agent',
      price: 100000,
      city: 'Bujumbura',
      address: 'Kiriri',
      ownerId: referredHostId
    })
  })

  if (!createListingRes.ok) {
    throw new Error(`Échec création annonce par agent: ${createListingRes.status} ${await createListingRes.text()}`)
  }

  const createListingData = await createListingRes.json() as any
  const listingId = createListingData.listing.id
  console.log(`✅ Annonce créée avec succès par l'agent. ID: ${listingId}`)

  // 5. Étape 3 : Tentative de création d'une annonce pour un hôte non géré (doit échouer)
  console.log('🔒 Tentative de création d\'annonce pour un hôte tiers (doit échouer)...')
  const unauthorizedListingRes = await fetch(`${API_URL}/api/agents/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      title: 'Appartement Fraude',
      description: 'Tentative illicite',
      price: 80000,
      city: 'Bujumbura',
      ownerId: otherHostId // Hôte non parrainé par cet agent !
    })
  })

  console.log(`🔒 Réponse annonce non autorisée: ${unauthorizedListingRes.status} (attendu: 403)`)
  if (unauthorizedListingRes.status !== 403) {
    throw new Error(`L'agent a pu créer une annonce pour un hôte non parrainé: ${unauthorizedListingRes.status}`)
  }
  console.log('✅ Sécurité confirmée : seuls les hôtes gérés par l\'agent peuvent avoir des annonces éditées par lui.')

  // 6. Étape 4 : Réservation & validation check-in (calcul de commission automatique)
  console.log('➡️ Étape 4 : Création d\'une réservation et simulation check-in (commission split)...')
  
  // Créer une réservation au statut CONFIRMED (simulation après paiement)
  const booking = await prisma.booking.create({
    data: {
      id: bookingId,
      listingId,
      guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000),
      totalPrice: 100000, // Commission de 5% = 5 000 BIF
      status: 'CONFIRMED'
    }
  })

  // Créer l'enregistrement de paiement associé au statut ESCROWED
  await prisma.payment.create({
    data: {
      bookingId: bookingId,
      provider: 'ECOCASH',
      reference: 'INT-AGENT-TEST-FLOW',
      amount: 100000,
      status: 'ESCROWED'
    }
  })

  // Simuler le check-in de cette réservation (fait par l'Hôte parrainé)
  // Générer le token de l'hôte parrainé pour faire le check-in
  const referredHostToken = generateToken(referredHostId, 'HOST')
  const checkInRes = await fetch(`${API_URL}/api/bookings/${bookingId}/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${referredHostToken}`
    },
    body: JSON.stringify({})
  })

  if (!checkInRes.ok) {
    throw new Error(`Échec du check-in de la réservation: ${checkInRes.status} ${await checkInRes.text()}`)
  }

  console.log('✅ Check-in validé.')

  // Vérifier en base que la commission d'agent a bien été calculée et enregistrée
  const commission = await prisma.agentCommission.findFirst({
    where: {
      agentId,
      bookingId
    }
  })

  if (!commission) {
    throw new Error('La commission de l\'agent n\'a pas été enregistrée dans la base de données !')
  }

  console.log(`✅ Commission agent enregistrée. Montant: ${commission.amount} BIF (attendu: 5000 BIF)`)
  if (commission.amount !== 5000) {
    throw new Error(`Le montant de la commission est incorrect: ${commission.amount} (attendu: 5000)`)
  }

  // 7. Étape 5 : Lecture du Tableau de bord Agent
  console.log('➡️ Étape 5 : Lecture du Tableau de bord de l\'Agent...')
  const dashboardRes = await fetch(`${API_URL}/api/agents/dashboard`, {
    headers: {
      'Authorization': `Bearer ${agentToken}`
    }
  })

  if (!dashboardRes.ok) {
    throw new Error(`Échec chargement tableau de bord: ${dashboardRes.status}`)
  }

  const dashboardData = await dashboardRes.json() as any
  console.log(`📊 Nombre d'hôtes parrainés renvoyé: ${dashboardData.hostsCount} (attendu: 1)`)
  console.log(`📊 Gains totaux cumulés: ${dashboardData.totalEarnedBif} BIF (attendu: 5000 BIF)`)
  console.log(`📊 Nombre d'annonces de l'hôte: ${dashboardData.hosts[0].listings.length} (attendu: 1)`)

  if (dashboardData.hostsCount !== 1 || dashboardData.totalEarnedBif !== 5000) {
    throw new Error('Les données du tableau de bord de l\'agent sont incorrectes !')
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DU PORTAIL AGENT ET DES COMMISSIONS SONT RÉUSSIS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

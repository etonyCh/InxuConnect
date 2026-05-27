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
  console.log('🚀 Démarrage du test d\'intégration Double-Blind Reviews & Badges de Confiance...')

  // 1. Nettoyage et initialisation des utilisateurs de test
  const guestId = 'test_guest_reviews'
  const hostId = 'test_host_reviews'
  const listingId = 'test_listing_reviews'
  const bookingId = 'test_booking_reviews'

  console.log('🧹 Nettoyage des anciennes données de test...')
  await prisma.review.deleteMany({
    where: {
      OR: [
        { authorId: guestId },
        { targetId: guestId },
        { authorId: hostId },
        { targetId: hostId }
      ]
    }
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

  console.log('👤 Création du Voyageur et de l\'Hôte...')
  // On crée l'hôte avec KYCStatus.VERIFIED pour pouvoir tester les promotions de badges
  const hostUser = await prisma.user.create({
    data: {
      id: hostId,
      email: 'host_reviews@test.com',
      name: 'Host Test Reviews',
      password: 'password_test_123',
      phone: '+25779111111',
      kycStatus: KycStatus.VERIFIED,
      role: 'HOST',
      badge: Badge.VERIFIED
    }
  })

  const guestUser = await prisma.user.create({
    data: {
      id: guestId,
      email: 'guest_reviews@test.com',
      name: 'Guest Test Reviews',
      password: 'password_test_123',
      phone: '+25779222222',
      kycStatus: KycStatus.VERIFIED,
      role: 'GUEST',
      badge: Badge.VERIFIED
    }
  })

  console.log('🏡 Création du Logement...')
  await prisma.listing.create({
    data: {
      id: listingId,
      title: 'Villa de Test Reviews',
      description: 'Superbe villa pour tester les avis',
      price: 150000,
      city: 'Bujumbura',
      ownerId: hostId
    }
  })

  console.log('📅 Création de la Réservation (Statut: CHECKED_IN)...')
  await prisma.booking.create({
    data: {
      id: bookingId,
      listingId,
      guestId,
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2), // 2 jours plus tard
      totalPrice: 300000,
      status: 'CHECKED_IN'
    }
  })

  const guestToken = generateToken(guestId, 'GUEST')
  const hostToken = generateToken(hostId, 'HOST')

  // 2. Étape 1 : Le voyageur soumet son avis
  console.log('➡️ Étape 1 : Le Voyageur soumet un avis de 5 étoiles...')
  const guestReviewRes = await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Super séjour, hôte très accueillant !'
    })
  })

  if (!guestReviewRes.ok) {
    throw new Error(`Échec soumission avis voyageur: ${guestReviewRes.status} ${await guestReviewRes.text()}`)
  }

  const guestReviewData = await guestReviewRes.json() as any
  console.log(`✅ Avis Voyageur soumis. Révélé: ${guestReviewData.revealed} (attendu: false)`)
  if (guestReviewData.revealed !== false) {
    throw new Error('L\'avis a été révélé prématurément !')
  }

  // 3. Étape 2 : Vérification du Double-Blind Mask (GET /api/bookings/:id/reviews)
  console.log('➡️ Étape 2 : Vérification de la visibilité des avis pour l\'Hôte (doit être masqué)...')
  const hostGetReviewsRes = await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
    headers: {
      'Authorization': `Bearer ${hostToken}`
    }
  })

  if (!hostGetReviewsRes.ok) {
    throw new Error(`Échec récupération avis par l'hôte: ${hostGetReviewsRes.status}`)
  }

  const hostReviewsData = await hostGetReviewsRes.json() as any[]
  console.log(`✅ Nombre d'avis récupérés par l'hôte: ${hostReviewsData.length} (attendu: 1)`)
  
  const guestReviewForHost = hostReviewsData.find(r => r.authorId === guestId)
  if (!guestReviewForHost || guestReviewForHost.rating !== null || guestReviewForHost.comment.includes('Super séjour')) {
    throw new Error('Le masque Double-Blind n\'a pas fonctionné pour l\'hôte !')
  }
  console.log('🔒 Le contenu et la note de l\'avis du Voyageur sont bien masqués pour l\'Hôte.')

  // Vérifier également que le voyageur peut voir son propre avis
  console.log('➡️ Vérification de la visibilité pour le Voyageur (doit voir son propre avis)...')
  const guestGetReviewsRes = await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  })
  const guestReviewsData = await guestGetReviewsRes.json() as any[]
  const guestReviewForGuest = guestReviewsData.find(r => r.authorId === guestId)
  if (!guestReviewForGuest || guestReviewForGuest.rating !== 5 || !guestReviewForGuest.comment.includes('Super séjour')) {
    throw new Error('Le voyageur ne peut pas voir son propre avis non révélé !')
  }
  console.log('👁️ Le Voyageur peut bien voir son propre avis.')

  // 4. Étape 3 : L'hôte soumet son avis
  console.log('➡️ Étape 3 : L\'Hôte soumet un avis de 5 étoiles pour le Voyageur...')
  const hostReviewRes = await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      rating: 5,
      comment: 'Voyageur très respectueux, je recommande !'
    })
  })

  if (!hostReviewRes.ok) {
    throw new Error(`Échec soumission avis hôte: ${hostReviewRes.status} ${await hostReviewRes.text()}`)
  }

  const hostReviewData = await hostReviewRes.json() as any
  console.log(`✅ Avis Hôte soumis. Révélé: ${hostReviewData.revealed} (attendu: true)`)
  if (hostReviewData.revealed !== true) {
    throw new Error('Les avis auraient dû être révélés car les deux parties ont évalué !')
  }

  // 5. Étape 4 : Vérification de la révélation des avis
  console.log('➡️ Étape 4 : Vérification de la révélation des avis pour les deux parties...')
  const finalGetReviewsRes = await fetch(`${API_URL}/api/bookings/${bookingId}/reviews`, {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  })
  const finalReviews = await finalGetReviewsRes.json() as any[]
  
  const revealedGuestReview = finalReviews.find(r => r.authorId === guestId)
  const revealedHostReview = finalReviews.find(r => r.authorId === hostId)

  if (!revealedGuestReview || revealedGuestReview.rating !== 5 || !revealedHostReview || revealedHostReview.rating !== 5) {
    throw new Error('Les avis ne sont pas complètement révélés ou les notes sont incorrectes !')
  }
  console.log('🔓 Les deux avis sont maintenant visibles en clair.')

  // 6. Étape 5 : Vérification de la réputation de l'hôte et promotion du badge à FIABLE
  console.log('➡️ Étape 5 : Vérification des agrégations et de la promotion progressive du badge de l\'Hôte...')
  // Le profil public de l'hôte doit indiquer une moyenne de 5 et 1 avis.
  // Cependant, pour passer "FIABLE", il faut au moins 3 réservations complétées.
  // L'hôte a actuellement 1 réservation CHECKED_IN. Son badge doit donc encore être VERIFIED.
  const hostProfileResBefore = await fetch(`${API_URL}/api/users/${hostId}/reviews`)
  const hostProfileBefore = await hostProfileResBefore.json() as any
  
  console.log(`⭐ Note moyenne de l'hôte: ${hostProfileBefore.averageRating} (attendu: 5)`)
  console.log(`📊 Nombre d'avis de l'hôte: ${hostProfileBefore.reviewCount} (attendu: 1)`)
  console.log(`🏅 Badge de l'hôte: ${hostProfileBefore.user.badge} (attendu: VERIFIED)`)
  
  if (hostProfileBefore.averageRating !== 5 || hostProfileBefore.reviewCount !== 1 || hostProfileBefore.user.badge !== 'VERIFIED') {
    throw new Error('Les agrégations initiales de réputation de l\'hôte sont incorrectes !')
  }

  // Créons deux réservations supplémentaires terminées pour l'hôte pour atteindre les 3 nécessaires pour FIABLE
  console.log('📈 Simulation de 2 réservations terminées supplémentaires pour l\'Hôte...')
  await prisma.booking.createMany({
    data: [
      {
        id: 'test_booking_extra_1',
        listingId,
        guestId,
        checkIn: new Date(),
        checkOut: new Date(),
        totalPrice: 100000,
        status: 'COMPLETED'
      },
      {
        id: 'test_booking_extra_2',
        listingId,
        guestId,
        checkIn: new Date(),
        checkOut: new Date(),
        totalPrice: 100000,
        status: 'COMPLETED'
      }
    ]
  })

  // Soumettons des avis croisés sur l'une d'elles pour déclencher le recalcul du badge
  console.log('➡️ Évaluation de la réservation supplémentaire pour déclencher le recalcul...')
  // Le voyageur évalue l'hôte
  await fetch(`${API_URL}/api/bookings/test_booking_extra_1/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({ rating: 4, comment: 'Très bien aussi !' })
  })
  // L'hôte évalue le voyageur -> Révélation et recalcul !
  await fetch(`${API_URL}/api/bookings/test_booking_extra_1/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({ rating: 5, comment: 'Rien à redire.' })
  })

  // Vérifions à nouveau le badge de l'hôte.
  // Nombre de réservations complétées de l'hôte = 3 (test_booking_reviews, test_booking_extra_1, test_booking_extra_2)
  // Avis de l'hôte = 2 (5 de la première réservation, 4 de la deuxième). Moyenne = 4.5.
  // KYCStatus = VERIFIED.
  // Les conditions pour FIABLE sont remplies (>= 3 bookings, moyenne >= 4.5) !
  const hostProfileResAfter = await fetch(`${API_URL}/api/users/${hostId}/reviews`)
  const hostProfileAfter = await hostProfileResAfter.json() as any

  console.log(`⭐ Nouvelle moyenne de l'hôte: ${hostProfileAfter.averageRating} (attendu: 4.5)`)
  console.log(`📊 Nouveau nombre d'avis de l'hôte: ${hostProfileAfter.reviewCount} (attendu: 2)`)
  console.log(`🏅 Nouveau badge de l'hôte: ${hostProfileAfter.user.badge} (attendu: FIABLE)`)

  if (hostProfileAfter.user.badge !== 'FIABLE') {
    throw new Error(`Le badge de l'hôte aurait dû être promu à FIABLE, mais il est de ${hostProfileAfter.user.badge}`)
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DES AVIS DOUBLE-BLIND ET BADGES DE CONFIANCE SONT RÉUSSIS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

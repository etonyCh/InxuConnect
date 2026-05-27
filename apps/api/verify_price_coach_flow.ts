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
  console.log('🚀 Démarrage du test d\'intégration du Price Coach (Suggéreur de prix)...')

  const testUserId = 'test_agent_coach'
  const testOwnerId = 'test_owner_coach'
  const competitorListingId = 'test_comp_listing'

  // 1. Nettoyage
  console.log('🧹 Nettoyage des anciennes données...')
  await prisma.listing.deleteMany({
    where: {
      OR: [
        { id: competitorListingId },
        { ownerId: testOwnerId }
      ]
    }
  })
  await prisma.user.deleteMany({
    where: {
      id: { in: [testUserId, testOwnerId] }
    }
  })

  // 2. Création utilisateurs
  const agent = await prisma.user.create({
    data: {
      id: testUserId,
      email: 'agent_coach@test.com',
      name: 'Agent Coach Test',
      password: 'password_test_123',
      phone: '+25779555555',
      role: 'AGENT'
    }
  })

  const owner = await prisma.user.create({
    data: {
      id: testOwnerId,
      email: 'owner_coach@test.com',
      name: 'Owner Coach Test',
      password: 'password_test_123',
      phone: '+25779666666',
      role: 'HOST'
    }
  })

  const agentToken = generateToken(testUserId, 'AGENT')

  // Helper pour calculer dynamiquement le prix attendu basé sur les concurrents existants en base
  const getExpectedBujumburaPrice = async (
    baseCalculated: number,
    eventMultiplier: number,
    seasonMultiplier: number,
    extraCompetitorPrice?: number
  ) => {
    const competitors = await prisma.listing.findMany({
      where: { city: { equals: 'Bujumbura', mode: 'insensitive' } },
      select: { price: true }
    })
    
    const competitorPrices = competitors.map(c => c.price)
    if (extraCompetitorPrice !== undefined) {
      competitorPrices.push(extraCompetitorPrice)
    }

    let competitorAverage = baseCalculated
    const hasComps = competitorPrices.length > 0
    if (hasComps) {
      competitorAverage = competitorPrices.reduce((acc, p) => acc + p, 0) / competitorPrices.length
    }

    const referencePrice = hasComps ? (baseCalculated + competitorAverage) / 2 : baseCalculated
    let suggested = referencePrice * eventMultiplier * seasonMultiplier
    suggested = Math.round(suggested / 1000) * 1000
    return Math.max(15000, suggested)
  }

  // 3. Test de l'API : Sans concurrence ajoutée (Bujumbura, 1 ch, 1 sdb, pas d'équipements, Juin)
  console.log('➡️ Étape 1 : Test de suggestion de prix standard...')
  const expectedPrice1 = await getExpectedBujumburaPrice(40000, 1.15, 1.05) // Juin: event=1.15, season=1.05

  const res1 = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      date: '2026-06-15'
    })
  })

  if (!res1.ok) {
    throw new Error(`Erreur API Étape 1: ${res1.status} ${await res1.text()}`)
  }

  const data1 = await res1.json() as any
  console.log(`Suggested Price: ${data1.suggestedPrice} BIF (Attendu: ${expectedPrice1})`)
  if (data1.suggestedPrice !== expectedPrice1) {
    throw new Error(`Le prix suggéré Bujumbura standard est incorrect: ${data1.suggestedPrice} (attendu: ${expectedPrice1})`)
  }

  // 4. Test de l'API : Impact des chambres et des équipements critiques
  console.log('➡️ Étape 2 : Test avec chambres et équipements premium...')
  const basePricePremium = 40000 + 15000 + 5000 + 15000 + 12000 // 87000 BIF
  const expectedPrice2 = await getExpectedBujumburaPrice(basePricePremium, 1.15, 1.05)

  const res2 = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['generator', 'starlink'],
      date: '2026-06-15'
    })
  })

  const data2 = await res2.json() as any
  console.log(`Suggested Price premium: ${data2.suggestedPrice} BIF (Attendu: ${expectedPrice2})`)
  if (data2.suggestedPrice !== expectedPrice2) {
    throw new Error(`Le prix suggéré Bujumbura premium est incorrect: ${data2.suggestedPrice} (attendu: ${expectedPrice2})`)
  }

  // 5. Test de l'API : Événement majeur (1er Juillet - Fête de l'Indépendance)
  console.log('➡️ Étape 3 : Test lors d\'un événement (1er Juillet)...')
  const expectedPrice3 = await getExpectedBujumburaPrice(40000, 1.25, 1.05) // Juillet 1er: event=1.25, season=1.05

  const res3 = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      date: '2026-07-01'
    })
  })

  const data3 = await res3.json() as any
  console.log(`Suggested Price Event (July 1st): ${data3.suggestedPrice} BIF (Attendu: ${expectedPrice3})`)
  if (data3.suggestedPrice !== expectedPrice3) {
    throw new Error(`Le prix suggéré du 1er Juillet est incorrect: ${data3.suggestedPrice} (attendu: ${expectedPrice3})`)
  }

  // 6. Test de l'API : Rentrée universitaire à Gitega (Septembre 5)
  console.log('➡️ Étape 4 : Test de rentrée universitaire à Gitega...')
  const gitegaCompetitors = await prisma.listing.findMany({
    where: { city: { equals: 'Gitega', mode: 'insensitive' } },
    select: { price: true }
  })
  let gitegaAverage = 30000
  const hasGitegaComps = gitegaCompetitors.length > 0
  if (hasGitegaComps) {
    gitegaAverage = gitegaCompetitors.reduce((acc, c) => acc + c.price, 0) / gitegaCompetitors.length
  }
  const gitegaRef = hasGitegaComps ? (30000 + gitegaAverage) / 2 : 30000
  let expectedPriceUniv = gitegaRef * 1.20 * 0.90 // event=1.20, season=0.90 (rainy season Gitega)
  expectedPriceUniv = Math.max(15000, Math.round(expectedPriceUniv / 1000) * 1000)

  const resUniversity = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Gitega',
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      date: '2026-09-05'
    })
  })

  const dataUniversity = await resUniversity.json() as any
  console.log(`Suggested Price Gitega University: ${dataUniversity.suggestedPrice} BIF (Attendu: ${expectedPriceUniv})`)
  if (dataUniversity.suggestedPrice !== expectedPriceUniv) {
    throw new Error(`Le prix suggéré Gitega rentrée universitaire est incorrect: ${dataUniversity.suggestedPrice} (attendu: ${expectedPriceUniv})`)
  }

  // 7. Test de l'API : Saison des pluies sans vs avec résilience
  console.log('➡️ Étape 5 : Test de résilience en saison des pluies...')
  const expectedPricePluieSans = await getExpectedBujumburaPrice(40000, 1.0, 0.90) // Avril: event=1.0, season=0.90

  const resPluieSans = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      date: '2026-04-15'
    })
  })

  const dataPluieSans = await resPluieSans.json() as any
  console.log(`Saison des pluies sans équipement: ${dataPluieSans.suggestedPrice} BIF (Attendu: ${expectedPricePluieSans})`)
  if (dataPluieSans.suggestedPrice !== expectedPricePluieSans) {
    throw new Error(`Le prix suggéré sans résilience en saison de pluie est incorrect: ${dataPluieSans.suggestedPrice} (attendu: ${expectedPricePluieSans})`)
  }

  const basePriceResilient = 40000 + 15000 + 8000 // 63000 BIF
  const expectedPricePluieAvec = await getExpectedBujumburaPrice(basePriceResilient, 1.0, 1.05) // Avril resilient: event=1.0, season=1.05

  const resPluieAvec = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 1,
      bathrooms: 1,
      amenities: ['generator', 'water_tank'],
      date: '2026-04-15'
    })
  })

  const dataPluieAvec = await resPluieAvec.json() as any
  console.log(`Saison des pluies avec équipement résilient: ${dataPluieAvec.suggestedPrice} BIF (Attendu: ${expectedPricePluieAvec})`)
  if (dataPluieAvec.suggestedPrice !== expectedPricePluieAvec) {
    throw new Error(`Le prix suggéré avec résilience en saison de pluie est incorrect: ${dataPluieAvec.suggestedPrice} (attendu: ${expectedPricePluieAvec})`)
  }

  // 8. Test de l'API : Avec concurrence ajoutée en base de données
  console.log('➡️ Étape 6 : Test avec ajout de concurrent réel...')
  
  // Créer un logement concurrent à Bujumbura à un tarif élevé (120 000 BIF)
  await prisma.listing.create({
    data: {
      id: competitorListingId,
      title: 'Villa Premium Concurrente',
      description: 'Villa de luxe pour fausser la moyenne',
      price: 120000,
      city: 'Bujumbura',
      ownerId: testOwnerId
    }
  })

  const expectedPriceConcurrence = await getExpectedBujumburaPrice(40000, 1.15, 1.05) // Juin standard avec le concurrent créé

  const resConcurrence = await fetch(`${API_URL}/api/listings/price-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${agentToken}`
    },
    body: JSON.stringify({
      city: 'Bujumbura',
      bedrooms: 1,
      bathrooms: 1,
      amenities: [],
      date: '2026-06-15'
    })
  })

  const dataConcurrence = await resConcurrence.json() as any
  console.log(`Suggested Price avec concurrence: ${dataConcurrence.suggestedPrice} BIF (Attendu: ${expectedPriceConcurrence})`)
  if (dataConcurrence.suggestedPrice !== expectedPriceConcurrence) {
    throw new Error(`Le prix suggéré sous influence de la concurrence est incorrect: ${dataConcurrence.suggestedPrice} (attendu: ${expectedPriceConcurrence})`)
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DU PRICE COACH SONT RÉUSSIS AVEC SUCCÈS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    // Nettoyage final
    await prisma.listing.deleteMany({
      where: {
        OR: [
          { id: 'test_comp_listing' },
          { ownerId: 'test_owner_coach' }
        ]
      }
    })
    await prisma.user.deleteMany({
      where: {
        id: { in: ['test_agent_coach', 'test_owner_coach'] }
      }
    })
    await prisma.$disconnect()
  })

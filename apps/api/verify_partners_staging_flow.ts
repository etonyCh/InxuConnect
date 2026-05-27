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
  console.log('🚀 Démarrage du test d\'intégration API Partenaires & Staging Virtuel...')

  // 1. Nettoyage
  console.log('🧹 Nettoyage des anciennes données de test...')
  
  await prisma.virtualStagingRequest.deleteMany({
    where: { listing: { owner: { email: 'staging_host@inzuconnect.local' } } }
  })
  await prisma.photo.deleteMany({
    where: { listing: { owner: { email: 'staging_host@inzuconnect.local' } } }
  })
  await prisma.listing.deleteMany({
    where: { owner: { email: 'staging_host@inzuconnect.local' } }
  })
  await prisma.user.deleteMany({
    where: { email: 'staging_host@inzuconnect.local' }
  })
  await prisma.partner.deleteMany({
    where: { apiKey: 'test_partner_key_12345' }
  })

  // 2. Création d'un partenaire test en base
  console.log('🔗 Création du partenaire de test...')
  const partner = await prisma.partner.create({
    data: {
      name: 'Burundi Channel Manager Ltd',
      apiKey: 'test_partner_key_12345'
    }
  })
  console.log(`✅ Partenaire créé avec succès (Clé: ${partner.apiKey})`)

  // 3. Création de l'hôte test en base
  console.log('👤 Création de l\'hôte de test avec un solde d\'épargne initial de 10 000 BIF...')
  const hostId = 'staging_test_host_' + Date.now().toString().slice(-4)
  const hostUser = await prisma.user.create({
    data: {
      id: hostId,
      email: 'staging_host@inzuconnect.local',
      name: 'Hôte Staging Test',
      password: 'password123',
      phone: '+25779000888',
      role: 'HOST',
      savingsBalance: 10000 // 10 000 BIF
    }
  })
  const hostToken = generateToken(hostUser.id, hostUser.role)
  console.log(`✅ Hôte créé: ${hostUser.name} (Solde d'épargne: ${hostUser.savingsBalance} BIF)`)

  // 4. Test d'accès anonyme / clé manquante au routeur partenaire
  console.log('🔒 Test d\'accès sans clé X-Partner-Key...')
  const failedListingRes = await fetch(`${API_URL}/api/partners/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Partner Hotel Room',
      description: 'Chambre confort centre-ville',
      price: 90000,
      city: 'Bujumbura',
      ownerId: hostUser.id
    })
  })
  
  if (failedListingRes.status !== 401) {
    throw new Error(`L'accès non authentifié aurait dû être rejeté par un code 401 (reçu: ${failedListingRes.status})`)
  }
  console.log('✅ Accès non authentifié rejeté avec succès (401).')

  // 5. Test de création d'une annonce via API partenaire authentifiée
  console.log('➡️ Création d\'un logement via API Partenaire avec clé valide...')
  const successListingRes = await fetch(`${API_URL}/api/partners/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Partner-Key': partner.apiKey
    },
    body: JSON.stringify({
      title: 'Hôtel Partenaire Bujumbura',
      description: 'Chambre haut standing importée par API',
      price: 120000,
      city: 'Bujumbura',
      address: 'Avenue du 18 Septembre',
      bedrooms: 1,
      bathrooms: 1,
      ownerId: hostUser.id,
      amenities: ['generator', 'starlink'],
      photos: ['https://r2.inzuconnect.com/listing_partner_1.jpg']
    })
  })

  if (!successListingRes.ok) {
    throw new Error(`Échec de la création via API Partenaire: ${successListingRes.status} ${await successListingRes.text()}`)
  }

  const listingData = await successListingRes.json() as any
  const createdListingId = listingData.listing.id
  console.log(`✅ Logement créé avec succès. ID: ${createdListingId}`)
  console.log(`- Titre: ${listingData.listing.title}`)
  console.log(`- Équipements associés: ${listingData.listing.amenities.map((a: any) => a.name).join(', ')}`)

  // 6. Test de demande de Staging Virtuel 3D IA payé via Solde d'Épargne
  console.log(`➡️ Demande de Staging Virtuel IA (5 000 BIF) payée via le solde d'épargne de l'hôte...`)
  const stagingRes = await fetch(`${API_URL}/api/host/listings/${createdListingId}/staging`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      payWithSavings: true
    })
  })

  if (!stagingRes.ok) {
    throw new Error(`Échec de la demande de staging virtuel: ${stagingRes.status} ${await stagingRes.text()}`)
  }

  const stagingData = await stagingRes.json() as any
  console.log(`✅ Staging virtuel complété !`)
  console.log(`- Type de pièce: ${stagingData.stagingRequest.scene.roomType}`)
  console.log(`- Mobilier généré: ${stagingData.stagingRequest.scene.furniture.map((f: any) => f.type).join(', ')}`)

  // 7. Vérification de la déduction en base de données
  console.log('➡️ Vérification de la mise à jour du solde d\'épargne de l\'hôte...')
  const updatedHost = await prisma.user.findUnique({
    where: { id: hostUser.id }
  })
  
  if (!updatedHost || updatedHost.savingsBalance !== 5000) {
    throw new Error(`Le solde d'épargne de l'hôte est incorrect: ${updatedHost?.savingsBalance} BIF (attendu: 5000 BIF)`)
  }
  console.log(`✅ Solde d'épargne de l'hôte mis à jour à: ${updatedHost.savingsBalance} BIF (Dépense de 5 000 BIF validée).`)

  // 8. Test de récupération publique du Staging Virtuel 3D
  console.log(`➡️ Récupération publique du Staging Virtuel 3D pour le logement ${createdListingId}...`)
  const getStagingRes = await fetch(`${API_URL}/api/listings/${createdListingId}/staging`)
  
  if (!getStagingRes.ok) {
    throw new Error(`Échec de la récupération du staging virtuel: ${getStagingRes.status} ${await getStagingRes.text()}`)
  }

  const getStagingData = await getStagingRes.json() as any
  console.log('✅ Staging récupéré avec succès.')
  if (getStagingData.stagingRequest.scene.roomType !== 'bedroom') {
    throw new Error(`Le type de chambre récupéré est incorrect: ${getStagingData.stagingRequest.scene.roomType}`)
  }
  
  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION API PARTENAIRES & STAGING VIRTUEL ONT ÉTÉ VÉRIFIÉS AVEC SUCCÈS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

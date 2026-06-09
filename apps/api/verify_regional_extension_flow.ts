import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'
const TEST_PHONE = '+25779987654'

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Regional Extension & Currencies (Phase 3)...');

  // 1. Nettoyage préliminaire
  const existingUser = await prisma.user.findFirst({
    where: { phone: TEST_PHONE }
  })
  if (existingUser) {
    console.log('🧹 Nettoyage de l\'ancien utilisateur de test...');
    await prisma.booking.deleteMany({ where: { guestId: existingUser.id } })
    await prisma.listing.deleteMany({ where: { ownerId: existingUser.id } })
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  // 2. Création et Authentification
  console.log('➡️ Demande d\'OTP...');
  const sendRes = await fetch(`${API_URL}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE })
  })
  if (!sendRes.ok) {
    throw new Error(`Échec envoi OTP: ${sendRes.status} ${await sendRes.text()}`)
  }

  const user = await prisma.user.findFirst({ where: { phone: TEST_PHONE } })
  if (!user || !user.otpCode) {
    throw new Error('Code OTP introuvable en DB')
  }

  console.log('➡️ Validation de l\'OTP...');
  const verifyRes = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE, code: user.otpCode })
  })
  if (!verifyRes.ok) {
    throw new Error(`Échec validation OTP: ${verifyRes.status}`)
  }
  const verifyData = await verifyRes.json() as any
  const token = verifyData.accessToken
  const userId = verifyData.user.id

  console.log(`✅ Authentifié avec succès. ID Utilisateur: ${userId}`);

  // 3. Test de création d'une annonce au Rwanda en RWF
  console.log('➡️ Création d\'une annonce au Rwanda (25,000 RWF)...');
  const createRwandaRes = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Bel appartement à Kigali',
      description: 'Logement moderne dans un quartier calme.',
      price: 25000,
      city: 'Kigali',
      country: 'Rwanda',
      currency: 'RWF',
      address: 'Kiyovu, Kigali',
      bedrooms: 2,
      bathrooms: 1,
      photos: ['https://r2.inzuconnect.local/listings/rwanda.jpg'],
      amenities: ['water_tank', 'starlink']
    })
  })

  if (!createRwandaRes.ok) {
    throw new Error(`Échec création annonce Rwanda: ${createRwandaRes.status} ${await createRwandaRes.text()}`)
  }

  const listingRwanda = await createRwandaRes.json() as any
  console.log(`✅ Annonce Rwanda créée: ${listingRwanda.id}, Country: ${listingRwanda.country}, Currency: ${listingRwanda.currency}`);

  // 4. Test de création d'une annonce en RDC en USD
  console.log('➡️ Création d\'une annonce en RDC (20 USD)...');
  const createRdcRes = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Chambre confortable à Bukavu',
      description: 'Chambre propre proche du centre.',
      price: 20,
      city: 'Bukavu',
      country: 'RDC',
      currency: 'USD',
      address: 'Ibanda, Bukavu',
      bedrooms: 1,
      bathrooms: 1,
      photos: ['https://r2.inzuconnect.local/listings/rdc.jpg'],
      amenities: ['generator']
    })
  })

  if (!createRdcRes.ok) {
    throw new Error(`Échec création annonce RDC: ${createRdcRes.status} ${await createRdcRes.text()}`)
  }

  const listingRdc = await createRdcRes.json() as any
  console.log(`✅ Annonce RDC créée: ${listingRdc.id}, Country: ${listingRdc.country}, Currency: ${listingRdc.currency}`);

  // 5. Test du filtrage par pays (GET /api/listings?country=Rwanda)
  console.log('➡️ Test du filtre par pays (country=Rwanda)...');
  const filterRwandaRes = await fetch(`${API_URL}/api/listings?country=Rwanda`)
  if (!filterRwandaRes.ok) throw new Error('Échec du filtre Rwanda')
  const filterRwandaData = await filterRwandaRes.json() as any
  console.log(`🔍 Logements trouvés pour le Rwanda: ${filterRwandaData.data.length}`);
  if (filterRwandaData.data.length === 0 || filterRwandaData.data.some((l: any) => l.country !== 'Rwanda')) {
    throw new Error('Le filtre par pays (Rwanda) a échoué.')
  }

  // 6. Test de conversion dynamique globale (GET /api/listings?targetCurrency=BIF)
  console.log('➡️ Test de la conversion dynamique globale vers le BIF (targetCurrency=BIF)...');
  const convertBifRes = await fetch(`${API_URL}/api/listings?targetCurrency=BIF`)
  if (!convertBifRes.ok) throw new Error('Échec conversion BIF')
  const convertBifData = await convertBifRes.json() as any
  
  const rwInBif = convertBifData.data.find((l: any) => l.id === listingRwanda.id)
  const rdcInBif = convertBifData.data.find((l: any) => l.id === listingRdc.id)

  console.log(`🔄 Rwanda listing price in BIF: ${rwInBif?.price} ${rwInBif?.currency}`);
  console.log(`🔄 RDC listing price in BIF: ${rdcInBif?.price} ${rdcInBif?.currency}`);

  // Taux de change : RWF = 0.45 (BIF base). 25000 RWF / 0.45 = ~55556 BIF
  if (!rwInBif || rwInBif.currency !== 'BIF' || rwInBif.price < 50000 || rwInBif.price > 60000) {
    throw new Error('La conversion du tarif du Rwanda vers le BIF est incorrecte.')
  }

  // Taux de change : USD = 0.00035. 20 USD / 0.00035 = ~57143 BIF
  if (!rdcInBif || rdcInBif.currency !== 'BIF' || rdcInBif.price < 55000 || rdcInBif.price > 60000) {
    throw new Error('La conversion du tarif de la RDC vers le BIF est incorrecte.')
  }

  // 7. Test de conversion dynamique des détails (GET /api/listings/:id?targetCurrency=USD)
  console.log(`➡️ Test de conversion dynamique des détails pour le Rwanda en USD...`);
  const detailsUsdRes = await fetch(`${API_URL}/api/listings/${listingRwanda.id}?targetCurrency=USD`)
  if (!detailsUsdRes.ok) throw new Error('Échec détails USD')
  const detailsUsdData = await detailsUsdRes.json() as any
  console.log(`🔄 Rwanda listing detail price in USD: ${detailsUsdData.price} ${detailsUsdData.currency}`);
  
  // 25000 RWF -> BIF = 55556 -> USD = 55556 * 0.00035 = ~19.44 USD
  if (detailsUsdData.currency !== 'USD' || detailsUsdData.price < 18 || detailsUsdData.price > 21) {
    throw new Error('La conversion de l\'annonce Rwanda en USD est incorrecte.')
  }

  // 8. Suppression des données de test
  console.log('➡️ Nettoyage final des logements...');
  await fetch(`${API_URL}/api/listings/${listingRwanda.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  await fetch(`${API_URL}/api/listings/${listingRdc.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
  await prisma.user.delete({ where: { id: userId } })

  console.log('\n🏆 TOUS LES TESTS REGIONAL EXTENSION & CURRENCIES SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

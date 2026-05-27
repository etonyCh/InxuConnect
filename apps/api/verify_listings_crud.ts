import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'
const TEST_PHONE = '+25779123456'

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Listings CRUD...');

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

  console.log(`✅ Authentifié avec succès. ID Utilisateur: ${userId}, Rôle de départ: ${verifyData.user.role}`);
  if (verifyData.user.role !== 'GUEST') {
    throw new Error(`Le rôle initial devrait être GUEST, reçu: ${verifyData.user.role}`)
  }

  // 3. Test de création d'une annonce (POST /api/listings)
  console.log('➡️ Création d\'une annonce...');
  const createRes = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Villa de Luxe au bord du Lac Tanganyika',
      description: 'Superbe endroit calme avec vue panoramique.',
      price: 150000,
      city: 'Bujumbura',
      address: 'Kabondo, Avenue de la Plage',
      bedrooms: 3,
      bathrooms: 2,
      taxiMotoDistance: 150,
      surchargeGenerator: 15000,
      photos: ['https://r2.inzuconnect.local/listings/villa1.jpg'],
      amenities: ['generator', 'water_tank', 'starlink', 'kitchen']
    })
  })

  if (!createRes.ok) {
    throw new Error(`Échec de la création de l'annonce: ${createRes.status} ${await createRes.text()}`)
  }

  const listing = await createRes.json() as any
  console.log(`✅ Annonce créée avec succès. ID Annonce: ${listing.id}`);
  
  // Vérification de la promotion du rôle de l'utilisateur
  const updatedUser = await prisma.user.findUnique({ where: { id: userId } })
  console.log(`✅ Rôle utilisateur mis à jour: ${updatedUser?.role} (attendu: HOST)`);
  if (updatedUser?.role !== 'HOST') {
    throw new Error(`L'utilisateur n'a pas été promu au rôle HOST`)
  }

  // Vérification de la description générée en français et kirundi
  console.log('📝 Description générée :');
  console.log(listing.description);
  if (!listing.description.includes('[Français]') || !listing.description.includes('[Kirundi]')) {
    throw new Error('La description générée ne contient pas les sections obligatoires [Français] et [Kirundi]')
  }

  // 4. Test d'obtention de la liste avec filtres (GET /api/listings)
  console.log('➡️ Test des filtres de recherche (GET /api/listings)...');
  
  // Filtre par ville Bujumbura
  const filterCityRes = await fetch(`${API_URL}/api/listings?city=Bujumbura`)
  const filterCityData = await filterCityRes.json() as any
  console.log(`🔍 Nombre d'annonces à Bujumbura: ${filterCityData.data.length}`);
  if (filterCityData.data.length === 0) {
    throw new Error('Filtre par ville défaillant')
  }

  // Vérification de l'optimisation des images (Cloudinary)
  const firstPhoto = filterCityData.data[0].photos[0];
  console.log(`🖼️ URL Photo originale ou optimisée: ${firstPhoto.url}`);
  if (process.env.CLOUDINARY_CLOUD_NAME && !firstPhoto.url.includes('cloudinary.com')) {
    throw new Error('L\'URL de l\'image n\'a pas été optimisée via Cloudinary alors que CLOUDINARY_CLOUD_NAME est défini')
  }

  // Filtre par équipement (hasGenerator)
  const filterGeneratorRes = await fetch(`${API_URL}/api/listings?hasGenerator=true`)
  const filterGeneratorData = await filterGeneratorRes.json() as any
  console.log(`🔍 Annonces avec groupe électrogène: ${filterGeneratorData.data.length}`);
  if (filterGeneratorData.data.length === 0) {
    throw new Error('Filtre par équipement (generator) défaillant')
  }

  // 5. Test d'obtention des détails (GET /api/listings/:id)
  console.log(`➡️ Récupération des détails de l'annonce ${listing.id}...`);
  const detailRes = await fetch(`${API_URL}/api/listings/${listing.id}`)
  if (!detailRes.ok) {
    throw new Error(`Échec récupération détails: ${detailRes.status}`)
  }
  const detailData = await detailRes.json() as any
  console.log(`✅ Détails récupérés. Titre: ${detailData.title}, Prix: ${detailData.price} FBu`);

  // 6. Test de mise à jour (PATCH /api/listings/:id)
  console.log('➡️ Mise à jour de l\'annonce (Modification du prix et des équipements)...');
  const patchRes = await fetch(`${API_URL}/api/listings/${listing.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      price: 180000,
      amenities: ['generator', 'water_tank'] // On retire starlink et kitchen
    })
  })

  if (!patchRes.ok) {
    throw new Error(`Échec de la mise à jour: ${patchRes.status} ${await patchRes.text()}`)
  }

  const updatedListing = await patchRes.json() as any
  console.log(`✅ Annonce mise à jour. Nouveau Prix: ${updatedListing.price} FBu`);
  if (updatedListing.price !== 180000) {
    throw new Error('Le prix de l\'annonce n\'a pas été mis à jour')
  }

  // Vérification de la régénération de la description
  if (!updatedListing.description.includes('[Français]') || !updatedListing.description.includes('[Kirundi]')) {
    throw new Error('La description mise à jour a perdu son format bilingue')
  }
  
  // Vérification des amenities mises à jour
  const hasStarlink = updatedListing.amenities.some((a: any) => a.name === 'starlink')
  console.log(`📡 Équipement Starlink présent après mise à jour? ${hasStarlink}`);
  if (hasStarlink) {
    throw new Error('Les équipements n\'ont pas été mis à jour correctement (starlink aurait dû être retiré)')
  }

  // 7. Test de suppression (DELETE /api/listings/:id)
  console.log(`➡️ Suppression de l'annonce ${listing.id}...`);
  const deleteRes = await fetch(`${API_URL}/api/listings/${listing.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!deleteRes.ok) {
    throw new Error(`Échec de la suppression: ${deleteRes.status}`)
  }
  console.log('✅ Annonce supprimée avec succès.');

  // 8. Vérification que l'annonce n'existe plus
  const verifyDeletedRes = await fetch(`${API_URL}/api/listings/${listing.id}`)
  console.log(`🔍 Tentative de récupération après suppression, statut: ${verifyDeletedRes.status}`);
  if (verifyDeletedRes.status !== 404) {
    throw new Error(`L'annonce n'a pas été réellement supprimée (statut retourné: ${verifyDeletedRes.status})`)
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION LISTINGS CRUD SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

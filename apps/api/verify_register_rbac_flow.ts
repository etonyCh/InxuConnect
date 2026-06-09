import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'

const GUEST_EMAIL = 'register_guest@inzu.bi'
const HOST_EMAIL = 'register_host@inzu.bi'
const PASSWORD = 'password123'

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Register & RBAC Flow...');

  // 1. Nettoyage préliminaire
  console.log('🧹 Nettoyage des anciens utilisateurs de test en base...');
  
  const oldGuest = await prisma.user.findUnique({ where: { email: GUEST_EMAIL } })
  if (oldGuest) {
    await prisma.booking.deleteMany({ where: { guestId: oldGuest.id } })
    await prisma.listing.deleteMany({ where: { ownerId: oldGuest.id } })
    await prisma.user.delete({ where: { id: oldGuest.id } })
  }

  const oldHost = await prisma.user.findUnique({ where: { email: HOST_EMAIL } })
  if (oldHost) {
    await prisma.booking.deleteMany({ where: { guestId: oldHost.id } })
    await prisma.listing.deleteMany({ where: { ownerId: oldHost.id } })
    await prisma.user.delete({ where: { id: oldHost.id } })
  }

  // 2. Inscription d'un utilisateur Voyageur (GUEST)
  console.log('➡️ Inscription d\'un GUEST...');
  const registerGuestRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Voyageur Test',
      email: GUEST_EMAIL,
      phone: '+25779000111',
      password: PASSWORD,
      role: 'GUEST'
    })
  })

  if (!registerGuestRes.ok) {
    throw new Error(`Échec de l'inscription du Guest: ${registerGuestRes.status} ${await registerGuestRes.text()}`)
  }

  const registerGuestData = await registerGuestRes.json() as any
  console.log(`✅ Inscription réussie. ID Guest: ${registerGuestData.user.id}, Role: ${registerGuestData.user.role}`);

  // 3. Connexion du GUEST
  console.log('➡️ Connexion du GUEST...');
  const loginGuestRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: GUEST_EMAIL,
      password: PASSWORD
    })
  })

  if (!loginGuestRes.ok) {
    throw new Error(`Échec de la connexion du Guest: ${loginGuestRes.status}`)
  }

  const loginGuestData = await loginGuestRes.json() as any
  const guestToken = loginGuestData.accessToken
  console.log(`✅ Connexion réussie. Access Token généré.`);

  // 4. Test RBAC: Tenter de créer une annonce avec le compte GUEST (devrait échouer avec 403)
  console.log('➡️ Tentative de création d\'un listing par le GUEST (Test RBAC - Devrait échouer)...');
  const createByGuestRes = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${guestToken}`
    },
    body: JSON.stringify({
      title: 'Villa interdite',
      description: 'Cette annonce ne devrait pas pouvoir être créée par un simple Guest.',
      price: 100000,
      city: 'Bujumbura',
      amenities: []
    })
  })

  console.log(`🔍 Statut de réponse reçu pour le Guest: ${createByGuestRes.status}`);
  if (createByGuestRes.status !== 403) {
    throw new Error(`Le système RBAC a échoué. Le Guest a pu appeler la création de listing avec le code statut: ${createByGuestRes.status}`)
  }
  const createByGuestError = await createByGuestRes.json() as any
  console.log(`✅ Route bloquée avec succès. Message d'erreur: ${createByGuestError.error}`);

  // 5. Inscription d'un utilisateur Hôte (HOST)
  console.log('➡️ Inscription d\'un HOST...');
  const registerHostRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Propriétaire Test',
      email: HOST_EMAIL,
      phone: '+25779000222',
      password: PASSWORD,
      role: 'HOST'
    })
  })

  if (!registerHostRes.ok) {
    throw new Error(`Échec de l'inscription du Host: ${registerHostRes.status}`)
  }

  const registerHostData = await registerHostRes.json() as any
  console.log(`✅ Inscription réussie. ID Host: ${registerHostData.user.id}, Role: ${registerHostData.user.role}`);

  // 6. Connexion du HOST
  console.log('➡️ Connexion du HOST...');
  const loginHostRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: HOST_EMAIL,
      password: PASSWORD
    })
  })

  if (!loginHostRes.ok) {
    throw new Error(`Échec de la connexion du Host: ${loginHostRes.status}`)
  }

  const loginHostData = await loginHostRes.json() as any
  const hostToken = loginHostData.accessToken
  console.log(`✅ Connexion réussie. Access Token généré.`);

  // 7. Test RBAC: Créer une annonce avec le compte HOST (devrait réussir)
  console.log('➡️ Création d\'un listing par le HOST (Test RBAC - Devrait réussir)...');
  const createByHostRes = await fetch(`${API_URL}/api/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hostToken}`
    },
    body: JSON.stringify({
      title: 'Villa du Hôte Autorisée',
      description: 'Cette annonce est créée par un hôte légitime.',
      price: 120000,
      city: 'Bujumbura',
      amenities: []
    })
  })

  if (!createByHostRes.ok) {
    throw new Error(`Échec de la création par le Host: ${createByHostRes.status} ${await createByHostRes.text()}`)
  }

  const listingCreated = await createByHostRes.json() as any
  console.log(`✅ Annonce créée avec succès. ID: ${listingCreated.id}`);

  // 8. Nettoyage final
  console.log('➡️ Nettoyage des données de test...');
  // Supprimer l'annonce créée
  const deleteRes = await fetch(`${API_URL}/api/listings/${listingCreated.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${hostToken}` }
  })
  if (!deleteRes.ok) console.error('Erreur lors du nettoyage de l\'annonce');

  // Supprimer les utilisateurs créés
  await prisma.user.delete({ where: { email: GUEST_EMAIL } })
  await prisma.user.delete({ where: { email: HOST_EMAIL } })

  console.log('\n🏆 TOUS LES TESTS D\'INSCRIPTION ET RBAC SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

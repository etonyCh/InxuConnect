import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3001'
const TEST_PHONE = '+25779777777'

async function runTest() {
  console.log('🚀 Démarrage du test d\'intégration Auth & KYC...');

  // 1. Nettoyage de l'utilisateur de test s'il existe
  const existingUser = await prisma.user.findFirst({
    where: { phone: TEST_PHONE }
  })
  if (existingUser) {
    console.log('🧹 Nettoyage de l\'ancien utilisateur de test...');
    await prisma.kycRequest.deleteMany({ where: { userId: existingUser.id } })
    await prisma.booking.deleteMany({ where: { guestId: existingUser.id } })
    await prisma.user.delete({ where: { id: existingUser.id } })
  }

  // 2. Envoi de l'OTP (Création/Inscription automatique)
  console.log(`➡️ Demande d'envoi d'OTP pour ${TEST_PHONE}...`);
  const sendRes = await fetch(`${API_URL}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE })
  })

  if (!sendRes.ok) {
    throw new Error(`Échec de l'envoi de l'OTP: ${sendRes.status} ${await sendRes.text()}`)
  }
  const sendData = await sendRes.json() as any
  if (!sendData.success) {
    throw new Error('Le statut success n\'est pas true lors de l\'envoi de l\'OTP')
  }
  console.log('✅ OTP généré avec succès.');

  // 3. Récupération de l'OTP directement en base de données pour simuler la réception SMS
  const userInDb = await prisma.user.findFirst({
    where: { phone: TEST_PHONE }
  })
  if (!userInDb || !userInDb.otpCode) {
    throw new Error('L\'utilisateur ou le code OTP n\'a pas été créé en base de données')
  }
  const receivedOtp = userInDb.otpCode
  console.log(`📲 [Mock SMS] Code OTP reçu de la DB: ${receivedOtp}`);

  // 4. Test d'accès aux routes protégées sans Token (doit échouer)
  console.log('🔒 Test d\'accès à /api/kyc/submit sans token...');
  const unauthorizedRes = await fetch(`${API_URL}/api/kyc/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cniUrl: 'url', selfieUrl: 'url' })
  })
  if (unauthorizedRes.status !== 401) {
    throw new Error(`La route protégée a renvoyé un statut inattendu: ${unauthorizedRes.status} (attendu: 401)`)
  }
  console.log('✅ Route sécurisée : accès anonyme rejeté avec succès (401).');

  // 5. Validation de l'OTP et récupération des tokens JWT
  console.log('➡️ Validation de l\'OTP...');
  const verifyRes = await fetch(`${API_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: TEST_PHONE, code: receivedOtp })
  })
  if (!verifyRes.ok) {
    throw new Error(`Échec de validation de l'OTP: ${verifyRes.status}`)
  }
  const verifyData = await verifyRes.json() as any
  const token = verifyData.accessToken
  const userId = verifyData.user.id
  if (!token) {
    throw new Error('Jeton d\'accès (accessToken) manquant dans la réponse')
  }
  console.log('✅ OTP validé. Jeton JWT généré avec succès.');

  // 6. Soumission du KYC (CNI + selfie) avec le Token JWT
  console.log('➡️ Soumission des documents KYC...');
  const kycSubmitRes = await fetch(`${API_URL}/api/kyc/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      cniUrl: 'https://r2.inzuconnect.local/cni.jpg',
      selfieUrl: 'https://r2.inzuconnect.local/selfie.jpg'
    })
  })
  if (!kycSubmitRes.ok) {
    throw new Error(`Échec de la soumission du KYC: ${kycSubmitRes.status} ${await kycSubmitRes.text()}`)
  }
  console.log('✅ KYC soumis avec succès (Statut: PENDING).');

  // Vérifier le statut de l'utilisateur en base de données
  let userAfterSubmit = await prisma.user.findUnique({ where: { id: userId } })
  if (userAfterSubmit?.kycStatus !== 'PENDING') {
    throw new Error(`Statut KYC de l'utilisateur incorrect après soumission: ${userAfterSubmit?.kycStatus} (attendu: PENDING)`)
  }
  console.log('✅ Statut de l\'utilisateur mis à jour à PENDING.');

  // 7. Simulation du Webhook Smile Identity pour valider le KYC
  console.log('➡️ Envoi du Webhook Smile Identity (Approbation)...');
  const webhookRes = await fetch(`${API_URL}/api/kyc/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, result: 'APPROVED' })
  })
  if (!webhookRes.ok) {
    throw new Error(`Échec du traitement du webhook KYC: ${webhookRes.status}`)
  }
  console.log('✅ Webhook traité.');

  // 8. Vérification finale en base de données
  const finalUser = await prisma.user.findUnique({ where: { id: userId } })
  if (finalUser?.kycStatus !== 'VERIFIED' || finalUser?.badge !== 'VERIFIED') {
    throw new Error(`Le statut final (${finalUser?.kycStatus}) ou le badge (${finalUser?.badge}) de l'utilisateur est incorrect (attendu: VERIFIED)`)
  }
  console.log('✅ Statut final de l\'utilisateur mis à jour à VERIFIED.');
  console.log('✅ Badge de confiance mis à jour à VERIFIED.');

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION AUTH & KYC SONT RÉUSSIS !');
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration a échoué:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

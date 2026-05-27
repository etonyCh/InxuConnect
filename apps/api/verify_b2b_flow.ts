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
  console.log('🚀 Démarrage du test d\'intégration Portail B2B & Facturation...')

  // 1. Nettoyage de l'ancienne compagnie test et des utilisateurs de test
  console.log('🧹 Nettoyage des anciennes données de test...')
  
  const oldCompany = await prisma.b2bCompany.findFirst({
    where: { name: 'Burundi Agro Corp' }
  })
  if (oldCompany) {
    await prisma.payment.deleteMany({
      where: { booking: { b2bCompanyId: oldCompany.id } }
    })
    await prisma.booking.deleteMany({
      where: { b2bCompanyId: oldCompany.id }
    })
    await prisma.user.updateMany({
      where: { b2bCompanyId: oldCompany.id },
      data: { b2bCompanyId: null }
    })
    await prisma.b2bCompany.delete({
      where: { id: oldCompany.id }
    })
  }

  await prisma.kycRequest.deleteMany({
    where: { user: { email: { in: ['admin@company.com', 'employee@company.com'] } } }
  })
  await prisma.payment.deleteMany({
    where: { booking: { guest: { email: { in: ['admin@company.com', 'employee@company.com'] } } } }
  })
  await prisma.booking.deleteMany({
    where: { guest: { email: { in: ['admin@company.com', 'employee@company.com'] } } }
  })
  await prisma.user.deleteMany({
    where: { email: { in: ['admin@company.com', 'employee@company.com'] } }
  })

  // 2. Création des utilisateurs de test dans la DB
  console.log('👤 Création de l\'administrateur et de l\'employé de test...')
  const adminId = 'b2b_test_admin_' + Date.now().toString().slice(-4)
  const employeeId = 'b2b_test_employee_' + Date.now().toString().slice(-4)

  const adminUser = await prisma.user.create({
    data: {
      id: adminId,
      email: 'admin@company.com',
      name: 'Admin Company',
      password: 'password123',
      phone: '+25779111222',
      role: 'GUEST'
    }
  })

  const employeeUser = await prisma.user.create({
    data: {
      id: employeeId,
      email: 'employee@company.com',
      name: 'Employee Company',
      password: 'password123',
      phone: '+25779111333',
      role: 'GUEST'
    }
  })

  // 3. Génération des tokens JWT
  const adminToken = generateToken(adminUser.id, adminUser.role)
  const employeeToken = generateToken(employeeUser.id, employeeUser.role)

  // 4. Enregistrement de l'entreprise B2B (par l'Admin)
  console.log('➡️ Enregistrement de l\'entreprise "Burundi Agro Corp" (Tier: ONG_INTERNATIONALE)...')
  const registerRes = await fetch(`${API_URL}/api/b2b/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Burundi Agro Corp',
      tier: 'ONG_INTERNATIONALE'
    })
  })

  if (!registerRes.ok) {
    throw new Error(`Échec de la création de la compagnie: ${registerRes.status} ${await registerRes.text()}`)
  }

  const registerData = await registerRes.json() as any
  console.log(`✅ Compagnie créée: ${registerData.company.name} (ID: ${registerData.company.id}, SaaS Fee: ${registerData.company.saasFee} BIF)`)
  const companyId = registerData.company.id

  // 5. Invitation et liaison de l'employé à l'entreprise
  console.log(`➡️ Invitation/rattachement du collaborateur (${employeeUser.email}) à l'entreprise...`)
  const inviteRes = await fetch(`${API_URL}/api/b2b/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: employeeUser.email
    })
  })

  if (!inviteRes.ok) {
    throw new Error(`Échec de l'invitation de l'employé: ${inviteRes.status} ${await inviteRes.text()}`)
  }

  const inviteData = await inviteRes.json() as any
  console.log(`✅ Employé rattaché avec succès: ${inviteData.user.name}`)

  // 6. Vérification de la limite par défaut de la Politique de voyage (100 000 BIF)
  console.log('➡️ Vérification de la politique de voyage par défaut (maxPricePerNight = 100 000 BIF)...')
  const initialDashboardRes = await fetch(`${API_URL}/api/b2b/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  })

  if (!initialDashboardRes.ok) {
    throw new Error(`Échec de la récupération du dashboard initial: ${initialDashboardRes.status}`)
  }

  const initialDashboardData = await initialDashboardRes.json() as any
  if (initialDashboardData.company.maxPricePerNight !== 100000) {
    throw new Error(`Politique par défaut inattendue: ${initialDashboardData.company.maxPricePerNight} BIF (attendu: 100 000)`)
  }
  console.log('✅ Politique par défaut correcte.')

  // S'assurer que le logement test 'prop_1' existe (son prix est de 150 000 BIF)
  const listing = await prisma.listing.findUnique({ where: { id: 'prop_1' } })
  if (!listing) {
    throw new Error('Logement "prop_1" absent de la DB, re-seed requis')
  }

  // 7. Tentative de réservation de 'prop_1' (150 000 BIF/nuit) par l'employé (doit échouer car limit = 100 000 BIF)
  console.log(`➡️ Tentative de réservation de "${listing.title}" à ${listing.price} BIF/nuit (Doit être bloquée car > 100 000 BIF)...`)
  const failedBookingRes = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({
      listingId: 'prop_1',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      totalPrice: 600000,
      paymentMethod: 'ECOCASH',
      phone: employeeUser.phone
    })
  })

  console.log(`🔒 Code retour de la réservation bloquée: ${failedBookingRes.status} (Attendu: 400)`)
  const failedBookingData = await failedBookingRes.json() as any
  console.log(`🔒 Message d'erreur reçu: "${failedBookingData.error}"`)
  if (failedBookingRes.status !== 400 || !failedBookingData.error.includes('Politique de voyage enfreinte')) {
    throw new Error('La réservation hors-politique n\'a pas été correctement rejetée par le backend')
  }
  console.log('✅ Tentative rejetée conformément à la politique de voyage d\'entreprise.')

  // 8. Mise à jour de la politique de voyage à 200 000 BIF par l'Admin
  console.log('➡️ Modification du plafond de la politique de voyage à 200 000 BIF...')
  const policyRes = await fetch(`${API_URL}/api/b2b/policy`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      maxPricePerNight: 200000
    })
  })

  if (!policyRes.ok) {
    throw new Error(`Échec de la modification de la politique: ${policyRes.status} ${await policyRes.text()}`)
  }
  console.log('✅ Politique de voyage mise à jour avec succès.')

  // 9. Nouvelle tentative de réservation de 'prop_1' par l'employé (doit réussir car 150 000 <= 200 000)
  console.log(`➡️ Nouvelle tentative de réservation à ${listing.price} BIF/nuit (Doit réussir)...`)
  const successBookingRes = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({
      listingId: 'prop_1',
      checkIn: '2026-07-01',
      checkOut: '2026-07-05',
      totalPrice: 600000,
      paymentMethod: 'ECOCASH',
      phone: employeeUser.phone
    })
  })

  if (!successBookingRes.ok) {
    throw new Error(`Échec de la réservation autorisée: ${successBookingRes.status} ${await successBookingRes.text()}`)
  }

  const successBookingData = await successBookingRes.json() as any
  console.log(`✅ Réservation créée avec succès. ID: ${successBookingData.id}, Statut: ${successBookingData.status}`)
  if (successBookingData.b2bCompanyId !== companyId) {
    throw new Error(`b2bCompanyId non renseigné ou incorrect sur la réservation: ${successBookingData.b2bCompanyId} (attendu: ${companyId})`)
  }

  // 10. Webhook de confirmation de paiement (SUCCESS) pour valider la réservation
  console.log('➡️ Envoi callback de paiement pour passer au statut ESCROWED/CONFIRMED...')
  const callbackRes = await fetch(`${API_URL}/api/payments/mock-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: successBookingData.payment.reference,
      status: 'SUCCESS'
    })
  })

  if (!callbackRes.ok) {
    throw new Error(`Échec du callback de paiement: ${callbackRes.status}`)
  }
  console.log('✅ Callback de paiement validé.')

  // 11. Récupération finale du Dashboard B2B et validation de la facturation consolidée
  console.log('➡️ Récupération du tableau de bord B2B consolidé...')
  const finalDashboardRes = await fetch(`${API_URL}/api/b2b/dashboard`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  })

  if (!finalDashboardRes.ok) {
    throw new Error(`Échec de la récupération du dashboard final: ${finalDashboardRes.status}`)
  }

  const dashboard = await finalDashboardRes.json() as any
  console.log('\n📊 Synthèse du Dashboard B2B :')
  console.log(`- Nombre de collaborateurs: ${dashboard.employeesCount}`)
  console.log(`- Forfait SaaS mensuel: ${dashboard.billingSummary.saasFee} BIF`)
  console.log(`- Nombre de séjours d'équipe actifs: ${dashboard.billingSummary.bookingsCount}`)
  console.log(`- Total réservations d'équipe: ${dashboard.billingSummary.bookingsTotalAmount} BIF`)
  console.log(`- FACTURE CONSOLIDÉE TOTALE: ${dashboard.billingSummary.totalInvoiceAmount} BIF`)

  // Validations mathématiques
  if (dashboard.employeesCount !== 2) {
    throw new Error(`Nombre de collaborateurs incorrect: ${dashboard.employeesCount} (attendu: 2)`)
  }
  if (dashboard.billingSummary.saasFee !== 200000) {
    throw new Error(`Forfait SaaS incorrect: ${dashboard.billingSummary.saasFee} (attendu: 200 000)`)
  }
  if (dashboard.billingSummary.bookingsCount !== 1) {
    throw new Error(`Nombre de séjours actifs incorrect: ${dashboard.billingSummary.bookingsCount} (attendu: 1)`)
  }
  if (dashboard.billingSummary.bookingsTotalAmount !== 600000) {
    throw new Error(`Montant séjours incorrect: ${dashboard.billingSummary.bookingsTotalAmount} (attendu: 600 000)`)
  }
  if (dashboard.billingSummary.totalInvoiceAmount !== 800000) {
    throw new Error(`Facture totale consolidée incorrecte: ${dashboard.billingSummary.totalInvoiceAmount} (attendu: 800 000)`)
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DU PORTAIL B2B ONT ÉTÉ VÉRIFIÉS AVEC SUCCÈS !')
}

runTest()
  .catch(err => {
    console.error('❌ Le test d\'intégration B2B a échoué:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

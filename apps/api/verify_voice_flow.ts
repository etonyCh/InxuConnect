import crypto from 'crypto'

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
  console.log('🚀 Démarrage du test d\'intégration de l\'Assistant Vocal (Voice Search)...')

  const token = generateToken('test_user_voice', 'GUEST')

  // 1. Étape 1 : Commande 100% Kirundi
  console.log('➡️ Étape 1 : Test de décodage d\'une commande vocale en Kirundi...')
  const resKirundi = await fetch(`${API_URL}/api/ai/voice-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      transcript: 'Ngozi inzu ifise moteri y\'umuriro'
    })
  })

  if (!resKirundi.ok) {
    throw new Error(`Échec Étape 1: ${resKirundi.status} ${await resKirundi.text()}`)
  }

  const dataKirundi = await resKirundi.json() as any
  console.log('Filtres Kirundi extraits :', JSON.stringify(dataKirundi.filters))

  if (dataKirundi.filters.city !== 'Ngozi') {
    throw new Error(`Ville incorrecte: ${dataKirundi.filters.city} (attendu: Ngozi)`)
  }
  if (dataKirundi.filters.hasGenerator !== true) {
    throw new Error(`Équipement generator manquant ou incorrect (attendu: true)`)
  }

  // 2. Étape 2 : Commande bilingue mixte (Code-switching)
  console.log('➡️ Étape 2 : Test de décodage d\'une commande bilingue mixte...')
  const resBilingue = await fetch(`${API_URL}/api/ai/voice-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      transcript: 'Je cherche une chambre i Gitega sous 30000 BIF avec generator et ikigega'
    })
  })

  if (!resBilingue.ok) {
    throw new Error(`Échec Étape 2: ${resBilingue.status}`)
  }

  const dataBilingue = await resBilingue.json() as any
  console.log('Filtres Bilingues extraits :', JSON.stringify(dataBilingue.filters))

  if (dataBilingue.filters.city !== 'Gitega') {
    throw new Error(`Ville incorrecte: ${dataBilingue.filters.city} (attendu: Gitega)`)
  }
  if (dataBilingue.filters.maxPrice !== 30000) {
    throw new Error(`Prix max incorrect: ${dataBilingue.filters.maxPrice} (attendu: 30000)`)
  }
  if (dataBilingue.filters.hasGenerator !== true || dataBilingue.filters.hasWaterTank !== true) {
    throw new Error(`Équipements generator ou water_tank manquants (attendus: true)`)
  }

  // 3. Étape 3 : Commande en Français
  console.log('➡️ Étape 3 : Test de décodage d\'une commande en Français...')
  const resFr = await fetch(`${API_URL}/api/ai/voice-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      transcript: 'Je veux un logement à Bujumbura pas cher avec la connexion Starlink'
    })
  })

  if (!resFr.ok) {
    throw new Error(`Échec Étape 3: ${resFr.status}`)
  }

  const dataFr = await resFr.json() as any
  console.log('Filtres Français extraits :', JSON.stringify(dataFr.filters))

  if (dataFr.filters.city !== 'Bujumbura') {
    throw new Error(`Ville incorrecte: ${dataFr.filters.city} (attendu: Bujumbura)`)
  }
  if (dataFr.filters.hasStarlink !== true) {
    throw new Error(`Équipement starlink manquant (attendu: true)`)
  }

  // 4. Étape 4 : Simulation de flux audio (Base64)
  console.log('➡️ Étape 4 : Test de décodage de flux audio (simulation Base64)...')
  const resAudio = await fetch(`${API_URL}/api/ai/voice-assistant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      audio: 'U291cyAzMDAwMCBGaXRlZ2E=abcde12345' // Simule l'audio "Sous 30000 Gitega..."
    })
  })

  if (!resAudio.ok) {
    throw new Error(`Échec Étape 4: ${resAudio.status}`)
  }

  const dataAudio = await resAudio.json() as any
  console.log('Transcription audio simulée :', dataAudio.transcript)
  console.log('Filtres audio extraits :', JSON.stringify(dataAudio.filters))

  if (dataAudio.filters.city !== 'Gitega') {
    throw new Error(`Ville décodée de l'audio incorrecte: ${dataAudio.filters.city} (attendu: Gitega)`)
  }
  if (dataAudio.filters.maxPrice !== 30000) {
    throw new Error(`Prix décodé de l'audio incorrect: ${dataAudio.filters.maxPrice} (attendu: 30000)`)
  }

  console.log('\n🏆 TOUS LES TESTS D\'INTÉGRATION DE L\'ASSISTANT VOCAL SONT RÉUSSIS !')
}

runTest().catch(err => {
  console.error('❌ Le test d\'intégration a échoué:', err)
  process.exit(1)
})

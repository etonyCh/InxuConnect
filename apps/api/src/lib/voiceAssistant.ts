export interface VoiceAssistantFilters {
  city?: string;
  maxPrice?: number;
  hasGenerator?: boolean;
  hasWaterTank?: boolean;
  hasStarlink?: boolean;
  hasSecurityGuard?: boolean;
  hasKitchen?: boolean;
  interpretedQuery?: string;
}

/**
 * Analyse une commande vocale (transcription) pour en extraire les filtres de recherche.
 */
export async function parseVoiceCommand(transcript: string): Promise<VoiceAssistantFilters> {
  const cleanedTranscript = transcript.trim();
  
  if (!cleanedTranscript) {
    return {};
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('YOUR_')) {
    try {
      const filters = await callClaudeForVoiceParsing(apiKey, cleanedTranscript);
      return filters;
    } catch (e) {
      console.error("Erreur lors du décodage vocal par Claude API, utilisation du fallback :", e);
      return parseVoiceCommandFallback(cleanedTranscript);
    }
  } else {
    return parseVoiceCommandFallback(cleanedTranscript);
  }
}

/**
 * Appelle l'API Claude pour décoder la commande vocale de l'utilisateur
 */
async function callClaudeForVoiceParsing(apiKey: string, transcript: string): Promise<VoiceAssistantFilters> {
  const prompt = `Vous êtes l'assistant vocal NLP de la plateforme InzuConnect au Burundi.
Analysez la commande vocale suivante de l'utilisateur (qui peut être en Français, en Kirundi, ou un mélange bilingue des deux) et extrayez les filtres de recherche de logement sous forme de JSON strict.

Commande vocale : "${transcript}"

Consignes :
1. Extrayez les filtres suivants :
   - "city": Nom exact de la ville parmi "Bujumbura", "Gitega", "Ngozi" (ou null si non précisé)
   - "maxPrice": Prix maximum en BIF sous forme de nombre entier (ou null si non précisé)
   - "hasGenerator": true si l'utilisateur demande explicitement un groupe électrogène / "moteri" / "courant" (ou null)
   - "hasWaterTank": true si l'utilisateur demande explicitement une citerne d'eau / "ikigega" / "amazi" (ou null)
   - "hasStarlink": true si l'utilisateur demande explicitement internet Starlink / "umuhora" / "connexion" (ou null)
   - "hasSecurityGuard": true si l'utilisateur demande un gardien / "abazamu" / "sécurité" (ou null)
   - "hasKitchen": true si l'utilisateur demande une cuisine / "igikoni" (ou null)
   - "interpretedQuery": Une phrase résumant l'intention en Français (ex: "Logement à Gitega avec citerne d'eau sous 35 000 FBu")

2. Renvoyez UNIQUEMENT le JSON strict sans aucun autre texte d'introduction, conclusion ou bloc de code Markdown (\`\`\`).`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API returned status ${response.status}`);
  }

  const data = await response.json() as any;
  const rawText = (data.content?.[0]?.text || '').trim();

  // Nettoyer les blocs markdown éventuels
  const cleanJsonText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleanJsonText) as any;

  return {
    city: parsed.city || undefined,
    maxPrice: parsed.maxPrice || undefined,
    hasGenerator: parsed.hasGenerator === true ? true : undefined,
    hasWaterTank: parsed.hasWaterTank === true ? true : undefined,
    hasStarlink: parsed.hasStarlink === true ? true : undefined,
    hasSecurityGuard: parsed.hasSecurityGuard === true ? true : undefined,
    hasKitchen: parsed.hasKitchen === true ? true : undefined,
    interpretedQuery: parsed.interpretedQuery || undefined
  };
}

/**
 * Analyseur par expressions régulières de secours (Français/Kirundi)
 */
function parseVoiceCommandFallback(transcript: string): VoiceAssistantFilters {
  const text = transcript.toLowerCase();
  const filters: VoiceAssistantFilters = {};

  // 1. Détection de la ville
  if (text.includes('bujumbura') || text.includes('buja') || text.includes('bujo')) {
    filters.city = 'Bujumbura';
  } else if (text.includes('gitega')) {
    filters.city = 'Gitega';
  } else if (text.includes('ngozi')) {
    filters.city = 'Ngozi';
  }

  // 2. Détection du prix maximum (ex: "munsi ya 30000", "sous 25 000", "max 40k")
  // Nettoyer les espaces entre les chiffres (ex: "30 000" -> "30000")
  const textCleanedDigits = text.replace(/(\d+)\s+(?=\d)/g, '$1');
  
  // Chercher des nombres dans le texte
  const numberMatches = textCleanedDigits.match(/\b\d+\b/g);
  if (numberMatches && numberMatches.length > 0) {
    // Prendre le premier nombre significatif comme prix maximum
    const priceCandidates = numberMatches
      .map(n => parseInt(n, 10))
      .filter(p => p >= 5000); // Seuil minimal cohérent pour une nuit

    if (priceCandidates.length > 0) {
      filters.maxPrice = priceCandidates[0];
    }
  } else {
    // Gérer les raccourcis k (ex: "40k" -> 40000)
    const kMatches = textCleanedDigits.match(/\b(\d+)k\b/i);
    if (kMatches) {
      filters.maxPrice = parseInt(kMatches[1], 10) * 1000;
    }
  }

  // 3. Équipements clés (Burundi specific)
  if (text.includes('generator') || text.includes('moteri') || text.includes('electrogene') || text.includes('courant')) {
    filters.hasGenerator = true;
  }
  if (text.includes('tank') || text.includes('ikigega') || text.includes('citerne') || text.includes('amazi')) {
    filters.hasWaterTank = true;
  }
  if (text.includes('starlink') || text.includes('umuhora') || text.includes('internet') || text.includes('wifi')) {
    filters.hasStarlink = true;
  }
  if (text.includes('gardien') || text.includes('abazamu') || text.includes('securite') || text.includes('mulinzi')) {
    filters.hasSecurityGuard = true;
  }
  if (text.includes('cuisine') || text.includes('igikoni') || text.includes('igisafuri')) {
    filters.hasKitchen = true;
  }

  // 4. Formulation de l'intention résumée
  const summaryParts: string[] = [];
  if (filters.city) summaryParts.push(`à ${filters.city}`);
  if (filters.maxPrice) summaryParts.push(`sous ${filters.maxPrice.toLocaleString()} FBu`);
  
  const amenitiesList: string[] = [];
  if (filters.hasGenerator) amenitiesList.push('groupe électrogène');
  if (filters.hasWaterTank) amenitiesList.push('citerne');
  if (filters.hasStarlink) amenitiesList.push('Starlink');
  if (filters.hasSecurityGuard) amenitiesList.push('gardien');
  if (filters.hasKitchen) amenitiesList.push('cuisine');

  if (amenitiesList.length > 0) {
    summaryParts.push(`avec ${amenitiesList.join(', ')}`);
  }

  filters.interpretedQuery = summaryParts.length > 0 
    ? `Recherche : Logement ${summaryParts.join(' ')}`
    : `Recherche textuelle libre : "${transcript}"`;

  return filters;
}

/**
 * Service de traduction automatique Français <=> Kirundi pour InzuConnect.
 * Utilise l'API Claude (Anthropic) pour des traductions fidèles en Kirundi/Français.
 * Dispose d'un dictionnaire bilingue local pour le mode développement ou fallback.
 */

// Dictionnaire bilingue local pour les phrases courantes du chat de location
const dictionary: Record<string, string> = {
  // Français -> Kirundi
  "je suis en route": "ndi mu nzira",
  "je suis en route.": "ndi mu nzira.",
  "quelle est l'adresse exacte ?": "ni he ryerekezo ry'inzu ryiza ?",
  "quelle est l'adresse exacte": "ni he ryerekezo ry'inzu ryiza ?",
  "je suis arrivé": "nashitse",
  "je suis arrivé.": "nashitse.",
  "est-ce qu'il y a du courant ?": "umuriro urahari ?",
  "est-ce qu'il y a du courant": "umuriro urahari ?",
  "l'eau est coupée ?": "amazi yakutse ?",
  "l'eau est coupée": "amazi yakutse ?",
  "merci beaucoup": "murakoze cane",
  "merci beaucoup.": "murakoze cane.",
  "à quelle heure arrivez-vous ?": "mushika isaha zingahe ?",
  "à quelle heure arrivez-vous": "mushika isaha zingahe ?",
  "je serai là vers 18h": "ndashika nk'isaha zibiri z'umugoroba (18h)",
  "je serai là vers 18h.": "ndashika nk'isaha zibiri z'umugoroba (18h).",

  // Kirundi -> Français
  "ndi mu nzira": "je suis en route",
  "ndi mu nzira.": "je suis en route.",
  "ni he ryerekezo ry'inzu ryiza ?": "quelle est l'adresse exacte ?",
  "ni he ryerekezo ry'inzu ryiza": "quelle est l'adresse exacte ?",
  "nashitse": "je suis arrivé",
  "nashitse.": "je suis arrivé.",
  "umuriro urahari ?": "est-ce qu'il y a du courant ?",
  "umuriro urahari": "est-ce qu'il y a du courant ?",
  "amazi yakutse ?": "l'eau est coupée ?",
  "amazi yakutse": "l'eau est coupée ?",
  "murakoze cane": "merci beaucoup",
  "murakoze cane.": "merci beaucoup.",
  "mushika isaha zingahe ?": "à quelle heure arrivez-vous ?",
  "mushika isaha zingahe": "à quelle heure arrivez-vous ?",
  "ndashika nk'isaha zibiri z'umugoroba (18h)": "je serai là vers 18h",
  "ndashika nk'isaha zibiri z'umugoroba (18h).": "je serai là vers 18h.",
};

export async function translateMessage(text: string, toLang: 'FR' | 'RN'): Promise<string> {
  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Recherche dans le dictionnaire local (Vitesse & Économie d'API)
  if (dictionary[lowerText]) {
    // Conserve la casse approximative (ex: première lettre majuscule)
    const translation = dictionary[lowerText];
    if (cleanText[0] === cleanText[0].toUpperCase()) {
      return translation[0].toUpperCase() + translation.slice(1);
    }
    return translation;
  }

  // 2. Appel à l'API Claude si configurée
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('YOUR_')) {
    console.log(`⚠️ ANTHROPIC_API_KEY manquante. Utilisation du simulateur de traduction vers ${toLang}.`);
    return generateMockTranslation(cleanText, toLang);
  }

  const targetLangName = toLang === 'FR' ? 'Français' : 'Kirundi';
  const prompt = `Vous êtes un traducteur expert bilingue Kirundi et Français.
Traduisez le message suivant en ${targetLangName}. Conservez le ton (familier, amical ou poli) du message original.
Retournez UNIQUEMENT la traduction brute, sans guillemets, sans commentaires et sans explications supplémentaires.

Message à traduire : "${cleanText}"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`❌ Échec API Claude traduction: ${response.status}`);
      return generateMockTranslation(cleanText, toLang);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;

    if (!content) {
      return generateMockTranslation(cleanText, toLang);
    }

    // Nettoie d'éventuels guillemets superflus
    return content.trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('❌ Erreur réseau lors de la traduction:', error);
    return generateMockTranslation(cleanText, toLang);
  }
}

/**
 * Génère un texte de traduction simulé si Claude n'est pas disponible.
 */
function generateMockTranslation(text: string, toLang: 'FR' | 'RN'): string {
  if (toLang === 'RN') {
    return `[Simulé Kirundi] ${text}`;
  } else {
    // Si on veut traduire du Kirundi simulé vers le français, on enlève le préfixe
    if (text.startsWith('[Simulé Kirundi] ')) {
      return text.replace('[Simulé Kirundi] ', '');
    }
    return `[Simulé Français] ${text}`;
  }
}

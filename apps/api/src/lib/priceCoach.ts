import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface PriceCoachDetails {
  city: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  date?: string; // YYYY-MM-DD format
}

export interface PriceCoachResult {
  suggestedPrice: number;
  justification: string;
}

/**
 * Calcule le prix optimal suggéré et fournit une explication bilingue (Kirundi/Français).
 */
export async function suggestListingPrice(details: PriceCoachDetails): Promise<PriceCoachResult> {
  const { city, bedrooms, bathrooms, amenities, date } = details;

  // 1. Détermination du prix de base selon la ville (marché burundais)
  let calculatedBasePrice = 20000; // Base par défaut
  const normalizedCity = city.trim().toLowerCase();
  
  if (normalizedCity === 'bujumbura') {
    calculatedBasePrice = 40000;
  } else if (normalizedCity === 'gitega') {
    calculatedBasePrice = 30000;
  } else if (normalizedCity === 'ngozi') {
    calculatedBasePrice = 25000;
  }

  // Ajout par chambre supplémentaire (au-delà de 1)
  const roomPriceBonus = Math.max(0, bedrooms - 1) * 15000;
  // Ajout par salle de bain supplémentaire (au-delà de 1)
  const bathPriceBonus = Math.max(0, bathrooms - 1) * 5000;

  // Bonus pour équipements de confiance critiques au Burundi
  let amenitiesBonus = 0;
  const hasGenerator = amenities.includes('generator');
  const hasWaterTank = amenities.includes('water_tank');
  const hasStarlink = amenities.includes('starlink');
  const hasSecurityGuard = amenities.includes('security_guard');
  const hasKitchen = amenities.includes('kitchen');

  if (hasGenerator) amenitiesBonus += 15000;     // Groupe électrogène (très premium en raison des coupures REGIDESO)
  if (hasWaterTank) amenitiesBonus += 8000;       // Citerne d'eau
  if (hasStarlink) amenitiesBonus += 12000;       // Internet satellite haut débit
  if (hasSecurityGuard) amenitiesBonus += 5000;   // Sécurité 24/7
  if (hasKitchen) amenitiesBonus += 5000;         // Cuisine équipée

  const myBaseCalculated = calculatedBasePrice + roomPriceBonus + bathPriceBonus + amenitiesBonus;

  // 2. Moyenne de la concurrence dans la même ville
  let competitorAverage = myBaseCalculated;
  let hasCompetitors = false;
  try {
    const competitors = await prisma.listing.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' }
      },
      select: { price: true }
    });

    if (competitors.length > 0) {
      const sum = competitors.reduce((acc, c) => acc + c.price, 0);
      competitorAverage = sum / competitors.length;
      hasCompetitors = true;
    }
  } catch (error) {
    console.error('Erreur lors de la recherche des concurrents en base :', error);
  }

  // Prix de référence : équilibre entre calcul théorique et réalité du marché (50/50)
  const referencePrice = hasCompetitors 
    ? (myBaseCalculated + competitorAverage) / 2 
    : myBaseCalculated;

  // 3. Gestion des dates, événements et saisons au Burundi
  const targetDate = date ? new Date(date) : new Date();
  const month = targetDate.getMonth(); // 0-11
  const day = targetDate.getDate();

  let eventMultiplier = 1.0;
  let eventNameFr = "";
  let eventNameRn = "";

  // Événements spécifiques
  if (month === 6 && day === 1) { // 1er Juillet - Fête de l'Indépendance
    eventMultiplier = 1.25;
    eventNameFr = "la Fête de l'Indépendance du Burundi (haute affluence nationale)";
    eventNameRn = "Umunsi mukuru w'Ukwikukira kw'Uburundi (abashitsi baba ari benshi)";
  } else if (month === 1 && day === 5) { // 5 Février - Fête de l'Unité Nationale
    eventMultiplier = 1.15;
    eventNameFr = "la Fête de l'Unité Nationale";
    eventNameRn = "Umunsi mukuru w'Ubumwe bw'Abarundi";
  } else if (month === 8 && day >= 1 && day <= 15) { // 1-15 Septembre - Rentrée universitaire
    if (normalizedCity === 'bujumbura' || normalizedCity === 'gitega') {
      eventMultiplier = 1.20;
      eventNameFr = "la période de rentrée universitaire (forte demande de logements étudiants/enseignants)";
      eventNameRn = "igihe c'iyinjira ry'amashure makuru na kaminuza (abanyeshure n'abigisha barondera inzu)";
    }
  } else if (month === 5 || month === 6 || month === 7) { // Juin, Juillet, Août (Haute saison sèche / retour diaspora)
    eventMultiplier = 1.15;
    eventNameFr = "la haute saison sèche (visites de la diaspora et tourisme d'été)";
    eventNameRn = "igihe c'impeshi n'inyagato (ababa hanze barataha kandi ba mukerarugendo baba ari benshi)";
  }

  // Saisonnalité météo et infrastructure (Saison des pluies vs sèche)
  let seasonMultiplier = 1.0;
  let seasonNameFr = "";
  let seasonNameRn = "";

  const isRainySeason = [2, 3, 4, 8, 9, 10].includes(month); // Mars-Mai et Septembre-Novembre
  if (isRainySeason) {
    // Pendant la saison des pluies, les coupures REGIDESO (eau/électricité) sont très fréquentes
    if (hasGenerator && hasWaterTank) {
      // Valorisation premium de l'indépendance énergétique et hydrique
      seasonMultiplier = 1.05;
      seasonNameFr = "la valorisation de vos équipements de secours (groupe et citerne) pendant la saison des pluies";
      seasonNameRn = "agaciro k'ivyuma vy'amazi n'umuriro wa moteri mu gihe c'imvura";
    } else {
      // Léger rabais par manque d'équipements de secours en saison perturbée
      seasonMultiplier = 0.90;
      seasonNameFr = "la saison des pluies (risques de perturbations REGIDESO fréquentes)";
      seasonNameRn = "igihe c'imvura (ibibazo vy'amazi n'umuriro bitera haba ibura)";
    }
  } else {
    // Petites saisons sèches (Décembre-Janvier)
    seasonMultiplier = 1.05;
    seasonNameFr = "le climat agréable de la saison sèche";
    seasonNameRn = "igihe c'agatasi";
  }

  // Calcul final
  let finalSuggestedPrice = referencePrice * eventMultiplier * seasonMultiplier;
  
  // Arrondir au millier de BIF le plus proche
  finalSuggestedPrice = Math.round(finalSuggestedPrice / 1000) * 1000;

  // Sécurité : prix minimal de 15 000 BIF
  if (finalSuggestedPrice < 15000) {
    finalSuggestedPrice = 15000;
  }

  // 4. Génération de l'explication bilingue (Kirundi / Français)
  let justification = "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('YOUR_')) {
    try {
      justification = await callClaudeForJustification(
        apiKey,
        city,
        bedrooms,
        bathrooms,
        amenities,
        finalSuggestedPrice,
        competitorAverage,
        hasCompetitors,
        eventNameFr,
        seasonNameFr
      );
    } catch (e) {
      console.error("Erreur lors de l'explication par Claude API, utilisation du fallback bilingue :", e);
      justification = generateFallbackJustification(
        city,
        bedrooms,
        bathrooms,
        amenities,
        finalSuggestedPrice,
        competitorAverage,
        hasCompetitors,
        eventNameFr,
        eventNameRn,
        seasonNameFr,
        seasonNameRn
      );
    }
  } else {
    justification = generateFallbackJustification(
      city,
      bedrooms,
      bathrooms,
      amenities,
      finalSuggestedPrice,
      competitorAverage,
      hasCompetitors,
      eventNameFr,
      eventNameRn,
      seasonNameFr,
      seasonNameRn
    );
  }

  return {
    suggestedPrice: finalSuggestedPrice,
    justification
  };
}

/**
 * Appelle l'API Claude pour rédiger une justification de prix commerciale
 */
async function callClaudeForJustification(
  apiKey: string,
  city: string,
  bedrooms: number,
  bathrooms: number,
  amenities: string[],
  suggestedPrice: number,
  competitorAverage: number,
  hasCompetitors: boolean,
  eventNameFr: string,
  seasonNameFr: string
): Promise<string> {
  const prompt = `Vous êtes le "Price Coach" (expert en tarification) de la plateforme InzuConnect au Burundi.
Expliquez à l'hôte pourquoi nous lui suggérons un prix de ${suggestedPrice.toLocaleString()} FBu par nuit pour son logement à ${city}.

Détails du logement :
- Ville : ${city}
- Chambres : ${bedrooms}
- Salles de bain : ${bathrooms}
- Équipements : ${amenities.join(', ')}
${hasCompetitors ? `- Moyenne de la concurrence dans la ville : ${Math.round(competitorAverage).toLocaleString()} FBu` : '- Premier logement dans cette zone'}
${eventNameFr ? `- Facteur événementiel : ${eventNameFr}` : ''}
${seasonNameFr ? `- Facteur saisonnier : ${seasonNameFr}` : ''}

Consignes :
1. Rédigez une explication concise (max 3 phrases par langue) d'abord en Français, puis la traduction équivalente chaleureuse en Kirundi.
2. Expliquez l'impact positif des équipements Burundais installés (groupe électrogène contre les coupures REGIDESO, citerne, Starlink).
3. Le format de retour doit être EXACTEMENT comme ceci, sans aucune autre introduction ou conclusion :

[Français]
<Explication en Français>

[Kirundi]
<Explication en Kirundi>`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API returned status ${response.status}`);
  }

  const data = await response.json() as any;
  return (data.content?.[0]?.text || '').trim();
}

/**
 * Générateur d'explications de secours en cas d'absence de clé API Claude ou d'erreur réseau
 */
function generateFallbackJustification(
  city: string,
  bedrooms: number,
  bathrooms: number,
  amenities: string[],
  suggestedPrice: number,
  competitorAverage: number,
  hasCompetitors: boolean,
  eventNameFr: string,
  eventNameRn: string,
  seasonNameFr: string,
  seasonNameRn: string
): string {
  const hasGen = amenities.includes('generator');
  const hasTank = amenities.includes('water_tank');
  const hasWifi = amenities.includes('starlink');

  const amenityBulletsFr: string[] = [];
  const amenityBulletsRn: string[] = [];

  if (hasGen) {
    amenityBulletsFr.push("le groupe électrogène garantit l'électricité sans coupure");
    amenityBulletsRn.push("moteri y'umuriro ikurinda ibura ry'umuriro");
  }
  if (hasTank) {
    amenityBulletsFr.push("la citerne prévient les pénuries d'eau");
    amenityBulletsRn.push("ikigega c'amazi gikingira ibura ry'amazi");
  }
  if (hasWifi) {
    amenityBulletsFr.push("la connexion Internet Starlink ajoute une grande valeur");
    amenityBulletsRn.push("umuhora wa Starlink wunganya agaciro kanini");
  }

  const amenitiesDescFr = amenityBulletsFr.length > 0
    ? ` Grâce à vos équipements clés (${amenityBulletsFr.join(' et ')}), votre logement se positionne de manière très compétitive.`
    : '';

  const amenitiesDescRn = amenityBulletsRn.length > 0
    ? ` Kubera ibikoresho vyiza ufise (${amenityBulletsRn.join(' n\'')}), inzu yawe irakomeye cane ku isoko.`
    : '';

  const compTextFr = hasCompetitors
    ? `Le prix moyen constaté pour la ville de ${city} est de ${Math.round(competitorAverage).toLocaleString()} FBu/nuit.`
    : `Votre logement est l'un des premiers référencés à ${city}, offrant une opportunité unique.`;

  const compTextRn = hasCompetitors
    ? `Ikigereranyo c'ibiciro mu gisagara ca ${city} ni ${Math.round(competitorAverage).toLocaleString()} FBu ku ntaghe.`
    : `Inzu yawe n'imwe mu za mbere zanditswe muri ${city}, ifise ikibanza kiza ku isoko.`;

  const factorTextFr = eventNameFr || seasonNameFr
    ? ` Ce tarif tient également compte de ${eventNameFr || seasonNameFr}.`
    : '';

  const factorTextRn = eventNameRn || seasonNameRn
    ? ` Iki giciro kandi kirafise ishingiro rishingiye kuri ${eventNameRn || seasonNameRn}.`
    : '';

  return `[Français]
Nous vous suggérons un tarif de ${suggestedPrice.toLocaleString()} FBu par nuit pour ce logement de ${bedrooms} chambre(s) à ${city}.${amenitiesDescFr} ${compTextFr}${factorTextFr}

[Kirundi]
Turakugiriye inama yo gushira igiciro ca ${suggestedPrice.toLocaleString()} FBu ku ntaghe kuri iyi nzu y'ivyumba ${bedrooms} muri ${city}.${amenitiesDescRn} ${compTextRn}${factorTextRn}`;
}

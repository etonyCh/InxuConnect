/**
 * Service d'intégration Claude API (Anthropic) pour InzuConnect.
 * Permet de générer/traduire automatiquement les descriptions de logements
 * en Français et en Kirundi à la création d'une annonce.
 */

interface ListingDetails {
  title: string;
  baseDescription?: string;
  city: string;
  address?: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  amenities: string[];
  taxiMotoDistance?: number;
}

export async function generateListingDescription(details: ListingDetails): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('YOUR_')) {
    console.log('⚠️ ANTHROPIC_API_KEY non configurée. Utilisation du fallback bilingue structuré.');
    return generateFallbackDescription(details);
  }

  const prompt = `Vous êtes un expert en immobilier local au Burundi pour la plateforme InzuConnect.
Générez une description marketing attractive, professionnelle et accueillante pour ce logement, disponible dans les deux langues officielles : le Français et le Kirundi.

Voici les détails du logement :
- Titre : "${details.title}"
- Description de base fournie : "${details.baseDescription || 'Non fournie'}"
- Ville : ${details.city}
- Adresse : ${details.address || 'Non spécifiée'}
- Chambres : ${details.bedrooms}
- Salles de bain : ${details.bathrooms}
- Prix par nuit : ${details.price.toLocaleString()} FBu
- Équipements de confiance garantis : ${details.amenities.join(', ')}
- Distance station taxi-moto : ${details.taxiMotoDistance ? `${details.taxiMotoDistance} mètres` : 'Non précisée'}

Consignes strictes :
1. Rédigez d'abord la description complète en Français, puis la description complète en Kirundi.
2. Mettez en valeur les équipements de confiance spécifiques au Burundi (ex: groupe électrogène pour pallier aux coupures d'électricité REGIDESO, citerne d'eau, internet Starlink, sécurité 24/7).
3. Le format de retour doit être EXACTEMENT comme ceci, sans aucune autre introduction ou conclusion :

[Français]
<Description détaillée et fluide en Français mettant en valeur le confort et les équipements>

[Kirundi]
<Description équivalente et chaleureuse en Kirundi adaptée au marché local>`;

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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`❌ Erreur API Claude: ${response.status} ${await response.text()}`);
      return generateFallbackDescription(details);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error('❌ Contenu vide retourné par Claude');
      return generateFallbackDescription(details);
    }

    return content.trim();
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel à Claude API:', error);
    return generateFallbackDescription(details);
  }
}

/**
 * Générateur de description de secours bilingue lorsque l'API Claude n'est pas disponible.
 */
function generateFallbackDescription(details: ListingDetails): string {
  const { title, baseDescription, city, address, bedrooms, bathrooms, price, amenities, taxiMotoDistance } = details;

  const getAmenityLabelFr = (a: string) => {
    switch (a) {
      case 'generator': return 'groupe électrogène';
      case 'water_tank': return "citerne d'eau";
      case 'starlink': return 'Internet haut débit Starlink';
      case 'security_guard': return 'gardiennage sécurisé 24/7';
      case 'kitchen': return 'cuisine moderne équipée';
      default: return a;
    }
  };

  const getAmenityLabelRn = (a: string) => {
    switch (a) {
      case 'generator': return 'moteri y\'inguvu z\'umuriro';
      case 'water_tank': return 'ikigega c\'amazi';
      case 'starlink': return 'umuhora w\'itabazanya wa Starlink';
      case 'security_guard': return 'abazamu bacungera umutekano ijoro n\'umurango';
      case 'kitchen': return 'igikoni kigezweho';
      default: return a;
    }
  };

  const amenitiesFr = amenities.map(getAmenityLabelFr).join(', ');
  const amenitiesRn = amenities.map(getAmenityLabelRn).join(', ');

  const taxiFr = taxiMotoDistance ? ` accessible rapidement (station de taxi-moto à ${taxiMotoDistance}m)` : '';
  const taxiRn = taxiMotoDistance ? ` kandi ntiwibagire ko hari ikibanza c'amapikipiki hafi (ku metero ${taxiMotoDistance})` : '';

  const mainDescFr = baseDescription ? `${baseDescription}\n` : '';
  const mainDescRn = baseDescription ? `Ku bijanye n'iyi nzu: ${baseDescription}\n` : '';

  return `[Français]
Bienvenue au "${title}". ${mainDescFr}Ce magnifique logement situé à ${city}${address ? ` (${address})` : ''} offre un cadre idéal avec ses ${bedrooms} chambre(s) et ${bathrooms} salle(s) de bain.
Pour faire face aux défis locaux d'infrastructures au Burundi, le logement est doté de commodités haut de gamme : ${amenitiesFr || 'confort standard'}.${taxiFr}
Idéal pour les séjours professionnels ou de loisirs. Tarif : ${price.toLocaleString()} FBu par nuit (paiement Mobile Money EcoCash/Lumicash supporté).

[Kirundi]
Kaze kuri "${title}". ${mainDescRn}Iyi nzu nziza cane iri mu gisagara ca ${city}${address ? ` (${address})` : ''} irakubereye cane. Ifise ivyumba ${bedrooms} vyo kuryama n'ivyumba ${bathrooms} vyo kwiyogereramo.
Kugira ntiwigere uhura n'ibibazo vy'amazi cyangwa umuriro mu Burundi, iyi nzu irafise: ${amenitiesRn || 'ibikoresho vyiza'}.${taxiRn}
Ikiguzi ni ${price.toLocaleString()} FBu ku ntaghe (urashobora kwishura ukoresheje EcoCash cyangwa Lumicash).`;
}

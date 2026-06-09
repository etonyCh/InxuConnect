/**
 * Service de conversion de devises pour InzuConnect.
 * Devises gérées :
 * - BIF : Franc Burundais (devise de base)
 * - RWF : Franc Rwandais
 * - USD : Dollar Américain (utilisé en RDC)
 * - TZS : Shilling Tanzanien
 */

export const EXCHANGE_RATES: Record<string, number> = {
  BIF: 1.0,       // Devise de référence
  RWF: 0.45,      // ~1 BIF = 0.45 RWF (ou 1 RWF = 2.22 BIF)
  USD: 0.00035,   // ~1 BIF = 0.00035 USD (ou 1 USD = 2857 BIF)
  TZS: 0.90       // ~1 BIF = 0.90 TZS (ou 1 TZS = 1.11 BIF)
}

/**
 * Convertit un montant d'une devise source vers une devise cible.
 * 
 * @param amount Montant à convertir
 * @param from Devise d'origine (BIF, RWF, USD, TZS)
 * @param to Devise de destination (BIF, RWF, USD, TZS)
 * @returns Montant converti et arrondi de façon appropriée pour la devise cible
 */
export function convertCurrency(amount: number, from: string = 'BIF', to: string = 'BIF'): number {
  const normalizedFrom = from.toUpperCase().trim()
  const normalizedTo = to.toUpperCase().trim()

  if (normalizedFrom === normalizedTo) {
    return amount
  }

  const rateFrom = EXCHANGE_RATES[normalizedFrom] || 1.0
  const rateTo = EXCHANGE_RATES[normalizedTo] || 1.0

  // Conversion en passant par la base BIF :
  // BIF = amount / rateFrom
  // cible = BIF * rateTo
  const amountInBif = amount / rateFrom
  const convertedAmount = amountInBif * rateTo

  // Arrondi spécifique selon la devise pour un affichage propre
  if (normalizedTo === 'USD') {
    // 2 décimales pour les dollars
    return Math.round(convertedAmount * 100) / 100
  } else if (normalizedTo === 'RWF' || normalizedTo === 'TZS') {
    // Arrondir à l'unité la plus proche pour RWF et TZS
    return Math.round(convertedAmount)
  } else {
    // Arrondir aux 100 BIF près ou unité pour le BIF
    return Math.round(convertedAmount)
  }
}

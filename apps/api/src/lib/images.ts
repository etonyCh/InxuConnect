/**
 * Service d'optimisation d'images pour InzuConnect.
 * Utilise le mode "fetch" de Cloudinary pour transformer à la volée
 * n'importe quelle image distante (ex: Cloudflare R2) vers des formats
 * légers (WebP) et compressés (q_auto), adaptés à la connectivité du Burundi.
 */
export function optimizeImageUrl(url: string, width = 800): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME

  // Fallback si Cloudinary n'est pas configuré
  if (!cloudName) {
    return url
  }

  // Cloudinary ne peut pas fetch une URL pointant sur localhost
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url
  }

  try {
    const encodedUrl = encodeURIComponent(url)
    
    // Paramètres appliqués :
    // - f_auto : convertit en WebP ou AVIF selon le navigateur
    // - q_auto : compresse automatiquement sans perte de qualité visible
    // - w_XXX : redimensionne à la largeur demandée (par défaut 800px)
    // - c_limit : réduit l'image seulement si elle dépasse la largeur max
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${width},c_limit/${encodedUrl}`
  } catch (error) {
    console.error('❌ Erreur lors de l\'encodage de l\'URL pour Cloudinary:', error)
    return url
  }
}

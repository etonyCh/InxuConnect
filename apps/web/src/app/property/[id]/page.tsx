import Header from '@/components/Header'
import BookingForm from '@/components/BookingForm'
import Link from 'next/link'
import VirtualStagingVisualizer from '@/components/VirtualStagingVisualizer'
import Footer from '@/components/Footer'

async function getListing(id: string) {
  const res = await fetch(`http://localhost:3001/api/listings/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getStaging(id: string) {
  try {
    const res = await fetch(`http://localhost:3001/api/listings/${id}/staging`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.stagingRequest || null
  } catch (e) {
    return null
  }
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await getListing(id)
  const staging = property ? await getStaging(id) : null

  if (!property) {
    return (
      <main className="min-h-screen bg-stone-50/50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Logement introuvable</h1>
          <p className="mt-2 text-stone-500">Ce logement n'existe pas ou a été retiré.</p>
          <Link href="/" className="mt-6 inline-flex items-center text-sm font-semibold text-emerald-800 hover:text-emerald-900">
            &larr; Retour à l'accueil
          </Link>
        </div>
      </main>
    )
  }

  // Parse amenities from array
  const hasGenerator = property.amenities?.some((a: any) => a.name === 'generator')
  const hasWaterTank = property.amenities?.some((a: any) => a.name === 'water_tank')
  const hasSecurityGuard = property.amenities?.some((a: any) => a.name === 'security_guard')
  const hasStarlink = property.amenities?.some((a: any) => a.name === 'starlink')
  const hasKitchen = property.amenities?.some((a: any) => a.name === 'kitchen')

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors mb-6">
          &larr; Tous les logements
        </Link>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visual Cover */}
            <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-emerald-850 to-emerald-950 flex items-center justify-center text-white text-8xl font-black">
              {property.city[0]}
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Title & Owner Card */}
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
                    📍 {property.city}
                  </span>
                  {property.address && (
                    <span className="text-sm text-stone-500 font-medium">{property.address}</span>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-stone-900 leading-tight">
                  {property.title}
                </h1>
                <p className="mt-3 text-sm text-stone-500 font-medium">
                  {property.bedrooms} chambres &bull; {property.bathrooms} salles de bain &bull; Logement entier
                </p>
              </div>

              {/* Owner Info */}
              {property.owner && (
                <div className="flex items-center gap-4 pt-6 border-t border-stone-100">
                  <div className="h-12 w-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-lg">
                    {property.owner.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Hébergé par {property.owner.name}</h3>
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">{property.owner.role}</p>
                  </div>
                  {property.owner.badge !== 'NONE' && (
                    <span className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                      🏆 {property.owner.badge}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-stone-900 mb-4">À propos de ce logement</h2>
              <p className="text-stone-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {property.description}
              </p>
            </div>

            {/* Burundi specific Amenities Grid */}
            <div className="bg-white rounded-2xl border border-stone-200/50 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-stone-900 mb-6">Équipements de confiance (Garanties Burundi)</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Generator */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${hasGenerator ? 'bg-emerald-50/30 border-emerald-100' : 'bg-stone-50/50 border-stone-150 opacity-60'}`}>
                  <span className="text-2xl">🔋</span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Groupe Électrogène</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hasGenerator 
                        ? `Disponible (Surcharge : ${property.surchargeGenerator.toLocaleString()} FBu/nuit)` 
                        : 'Non disponible'
                      }
                    </p>
                  </div>
                </div>

                {/* Water Tank */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${hasWaterTank ? 'bg-emerald-50/30 border-emerald-100' : 'bg-stone-50/50 border-stone-150 opacity-60'}`}>
                  <span className="text-2xl">💧</span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Citerne d'Eau</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hasWaterTank ? 'Réserve d\'eau installée en cas de coupure' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Guard */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${hasSecurityGuard ? 'bg-emerald-50/30 border-emerald-100' : 'bg-stone-50/50 border-stone-150 opacity-60'}`}>
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Gardiennage 24/7</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hasSecurityGuard ? 'Présence d\'un agent de sécurité' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Starlink Wi-Fi */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${hasStarlink ? 'bg-emerald-50/30 border-emerald-100' : 'bg-stone-50/50 border-stone-150 opacity-60'}`}>
                  <span className="text-2xl">📡</span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Wi-Fi Starlink</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hasStarlink ? 'Connexion satellite haut débit' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Kitchen */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${hasKitchen ? 'bg-emerald-50/30 border-emerald-100' : 'bg-stone-50/50 border-stone-150 opacity-60'}`}>
                  <span className="text-2xl">🍳</span>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Cuisine Équipée</h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {hasKitchen ? 'Cuisine accessible pour cuisiner' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Taxi-moto distance */}
                {property.taxiMotoDistance !== null && (
                  <div className="p-4 rounded-xl border bg-emerald-50/30 border-emerald-100 flex items-start gap-3.5">
                    <span className="text-2xl">🏍️</span>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">Accès Taxi-Moto</h4>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Station la plus proche à {property.taxiMotoDistance} mètres.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Staging Virtuel 3D si disponible */}
            {staging && staging.scene && (
              <VirtualStagingVisualizer scene={staging.scene} listingTitle={property.title} />
            )}

          </div>

          {/* Right Column: Booking Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-stone-200/50 p-6 shadow-md">
              <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-stone-100">
                <span className="text-sm font-medium text-stone-500">Tarif par nuit</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-800">{property.price.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-stone-600">FBu</span>
                </div>
              </div>

              <BookingForm listingId={property.id} price={property.price} />

              <div className="mt-6 flex flex-col gap-3 text-center border-t border-stone-100 pt-5">
                <p className="text-xs text-stone-400 font-semibold flex items-center justify-center gap-1.5">
                  🛡️ Escrow sécurisé par InzuConnect
                </p>
                <p className="text-[11px] text-stone-400 leading-normal px-2">
                  L'acompte est sécurisé par la plateforme et reversé à l'hôte après votre check-in (scan QR).
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  )
}

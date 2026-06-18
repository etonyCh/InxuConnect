import Link from 'next/link'
import Header from '@/components/Header'
import VoiceSearchBar from '@/components/VoiceSearchBar'
import Footer from '@/components/Footer'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

function buildUrl(currentParams: any, newParams: any) {
  const params = { ...currentParams, ...newParams }
  Object.keys(params).forEach(key => {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      delete params[key]
    }
  })
  const search = new URLSearchParams(params).toString()
  return search ? `/?${search}` : '/'
}

async function getListings(searchParams: any) {
  const query = new URLSearchParams()
  if (searchParams.city) query.append('city', searchParams.city)
  if (searchParams.maxPrice) query.append('maxPrice', searchParams.maxPrice)
  if (searchParams.hasGenerator) query.append('hasGenerator', 'true')
  if (searchParams.hasWaterTank) query.append('hasWaterTank', 'true')
  if (searchParams.hasStarlink) query.append('hasStarlink', 'true')

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/listings?${query.toString()}`, { cache: 'no-store' })
  if (!res.ok) return { data: [] }
  return res.json()
}

export default async function Home({ searchParams }: { searchParams: Promise<any> }) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role === 'HOST') {
    redirect('/host/dashboard')
  } else if (role === 'AGENT') {
    redirect('/agent/dashboard')
  } else if (role === 'ADMIN') {
    redirect('/admin/dashboard')
  }

  const resolvedParams = await searchParams
  const { data: listings } = await getListings(resolvedParams)

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#023E2A] text-white py-24 sm:py-32">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#ffffff44 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white max-w-4xl mx-auto leading-tight">
            Trouvez votre logement idéal, en toute sécurité
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl text-emerald-50 font-light">
            Des offres de confiance à Bujumbura, Gitega et Ngozi.
          </p>
          
          <div className="w-full max-w-2xl mx-auto mt-10 mb-8 relative">
            <VoiceSearchBar />
          </div>
          
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/60 text-sm font-semibold text-white border border-yellow-500/50 shadow-sm">
              <span className="text-yellow-400">⚡</span> Electricité 24/7
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/60 text-sm font-semibold text-white border border-blue-400/50 shadow-sm">
              <span className="text-blue-400">💧</span> Eau Potable Assurée
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-900/60 text-sm font-semibold text-white border border-emerald-400/50 shadow-sm">
              <span className="text-emerald-400">📶</span> Wi-Fi Haut Débit
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">


        {/* Cities and search header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-stone-200/70 gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900">Listings</h2>
            <p className="mt-1 text-sm text-stone-500">Logements filtrés par pays, ville et équipements de secours.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href={buildUrl(resolvedParams, { city: '' })} className="px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer bg-stone-900 text-white shadow-sm">
              Toutes les villes
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600">Superhost</span>
              <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full translate-x-4"></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600">B2B</span>
              <div className="w-10 h-6 bg-stone-200 rounded-full flex items-center p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {listings?.map((l: any) => {
            const hasGenerator = l.amenities?.some((a: any) => a.name === 'generator')
            const hasWaterTank = l.amenities?.some((a: any) => a.name === 'water_tank')
            const hasStarlink = l.amenities?.some((a: any) => a.name === 'starlink')

            return (
              <Link key={l.id} href={`/property/${l.id}`} className="group flex flex-col">
                <article className="premium-card-shadow flex flex-col overflow-hidden rounded-2xl bg-white border border-stone-200/50 flex-1">
                  {/* Card Visual Header */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white text-5xl font-black opacity-90 group-hover:scale-105 transition-transform duration-300">
                      {l.city[0]}
                    </div>
                    
                    {/* Floating Price Tag */}
                    <div className="absolute top-4 left-4 rounded-lg bg-[#3b82f6] px-3 py-1.5 text-sm font-extrabold text-white shadow-md flex items-baseline gap-1">
                      <span>{l.price.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-blue-100">{l.currency || 'BIF'}/nuit</span>
                    </div>

                    {/* Trust Badges & Icons */}
                    <div className="absolute bottom-4 left-4 flex gap-1">
                      <span className="inline-flex items-center gap-1 bg-white/95 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm border border-stone-100">
                        <span className="text-yellow-500">⭐</span> Superhost
                      </span>
                    </div>
                    
                    <div className="absolute bottom-4 right-4 flex gap-1">
                      {hasGenerator && (
                        <span className="h-7 w-7 rounded-full bg-emerald-900/90 text-white flex items-center justify-center text-xs shadow-sm backdrop-blur-sm border border-white/20" title="Groupe électrogène">
                          ⚡
                        </span>
                      )}
                      {hasWaterTank && (
                        <span className="h-7 w-7 rounded-full bg-emerald-900/90 text-white flex items-center justify-center text-xs shadow-sm backdrop-blur-sm border border-white/20" title="Citerne d'eau">
                          💧
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="flex flex-col p-6 flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                        🇧🇮 {l.city}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">
                        {l.bedrooms} ch. • {l.bathrooms} sdb
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors flex-1 mb-2">
                      {l.title}
                    </h3>
                    
                    <p className="text-sm text-stone-500 line-clamp-2 mb-4 leading-relaxed">
                      {l.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-semibold text-stone-600">Réservation sécurisée</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                        Voir l'offre &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </div>

      <Footer />
    </main>
  )
}

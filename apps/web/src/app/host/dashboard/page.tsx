import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

async function getHostListings(ownerId: string) {
  const res = await fetch(`http://localhost:3001/api/listings?ownerId=${ownerId}`, { cache: 'no-store' })
  if (!res.ok) return { data: [] }
  return res.json()
}

export default async function HostDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const role = (session?.user as any)?.role
  if (role !== 'HOST' && role !== 'ADMIN') {
    redirect('/')
  }

  const ownerId = (session.user as any).id
  const { data: listings } = await getHostListings(ownerId)

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 mb-2">Tableau de Bord Propriétaire</h1>
        <p className="text-stone-500 mb-8">Gérez vos propriétés et suivez vos réservations au Burundi.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Revenus du mois</span>
            <span className="text-3xl font-black text-emerald-800">0 BIF</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Réservations actives</span>
            <span className="text-3xl font-black text-stone-900">0</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Propriétés en ligne</span>
            <span className="text-3xl font-black text-stone-900">{listings?.length || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-900">Vos Propriétés</h2>
            <Link href="/host/properties/new" className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
              + Ajouter une propriété
            </Link>
          </div>
          
          {listings && listings.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {listings.map((l: any) => (
                <div key={l.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                      {l.photos && l.photos.length > 0 ? (
                        <img src={l.photos[0].url} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">Sans photo</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900">{l.title}</h3>
                      <p className="text-sm text-stone-500 mb-1">📍 {l.city}</p>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-semibold">
                        {l.price.toLocaleString()} {l.currency}/nuit
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/property/${l.id}`} className="px-3 py-1.5 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">Voir</Link>
                    <button className="px-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">Modifier</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500">
              <p>Vous n'avez pas encore de propriété enregistrée.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  )
}

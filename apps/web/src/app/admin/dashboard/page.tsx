import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import KycActionButtons from '@/components/KycActionButtons'

async function getAdminData(token: string) {
  const res = await fetch('http://localhost:3001/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })
  if (!res.ok) return null
  return res.json()
}

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const role = (session?.user as any)?.role
  if (role !== 'ADMIN') {
    redirect('/')
  }

  const token = (session as any).accessToken
  const data = await getAdminData(token)

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 mb-2">Administration Globale</h1>
        <p className="text-stone-500 mb-8">Vue d'ensemble de la plateforme InzuConnect (Burundi).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Utilisateurs</span>
            <span className="text-3xl font-black text-stone-900">{data?.stats?.users || 0}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Propriétés</span>
            <span className="text-3xl font-black text-stone-900">{data?.stats?.listings || 0}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Réservations</span>
            <span className="text-3xl font-black text-emerald-800">{data?.stats?.bookings || 0}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Requêtes KYC</span>
            <span className="text-3xl font-black text-orange-600">{data?.stats?.kycPending || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-stone-900">Validation KYC En Attente</h2>
              <span className="text-xs font-bold text-stone-500 hover:text-emerald-800 cursor-pointer">Voir tout &rarr;</span>
            </div>
            {data?.pendingKyc && data.pendingKyc.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {data.pendingKyc.map((kyc: any) => (
                  <div key={kyc.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900">{kyc.user?.name}</h3>
                      <p className="text-sm text-stone-500">{kyc.user?.email}</p>
                      <a href={kyc.cniUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Voir CNI</a>
                    </div>
                    <KycActionButtons kycId={kyc.id} token={token} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-stone-500">
                <p>Aucune demande KYC en attente.</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-stone-900">Derniers Utilisateurs Inscrits</h2>
              <span className="text-xs font-bold text-stone-500 hover:text-emerald-800 cursor-pointer">Voir tout &rarr;</span>
            </div>
            {data?.recentUsers && data.recentUsers.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {data.recentUsers.map((u: any) => (
                  <div key={u.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900">{u.name}</h3>
                      <p className="text-sm text-stone-500">{u.email}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-stone-100 rounded text-stone-600">{u.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-stone-500">
                <p>Aucun nouvel utilisateur récent.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}

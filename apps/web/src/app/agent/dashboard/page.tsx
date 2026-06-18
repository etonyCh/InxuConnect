import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AgentCharts from '@/components/AgentCharts'

async function getAgentData(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/agents/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  })
  if (!res.ok) return null
  return res.json()
}

export default async function AgentDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const role = (session?.user as any)?.role
  if (role !== 'AGENT' && role !== 'ADMIN') {
    redirect('/')
  }

  const token = (session as any).accessToken
  const data = await getAgentData(token)

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 mb-2">Espace Agent</h1>
        <p className="text-stone-500 mb-8">Gérez vos recommandations et suivez vos commissions au Burundi.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Commissions totales</span>
            <span className="text-3xl font-black text-emerald-800">{data?.totalEarnedBif?.toLocaleString() || 0} BIF</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col">
            <span className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">Utilisateurs référés</span>
            <span className="text-3xl font-black text-stone-900">{data?.hostsCount || 0}</span>
          </div>
        </div>

        <AgentCharts />

        <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-900">Votre lien d'affiliation</h2>
            <button className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">
              Copier le lien
            </button>
          </div>
          <div className="p-6">
            <div className="bg-stone-100 rounded-lg p-4 font-mono text-sm text-stone-600 break-all">
              https://inzuconnect.bi/register?ref={session.user?.id}
            </div>
            <p className="mt-4 text-sm text-stone-500">Partagez ce lien pour inviter des utilisateurs (Hosts ou Guests) et gagnez des commissions sur leurs transactions !</p>
          </div>
        </div>

        {/* Liste des filleuls */}
        <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-xl font-bold text-stone-900">Vos Filleuls</h2>
          </div>
          {data?.hosts && data.hosts.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {data.hosts.map((host: any) => (
                <div key={host.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900">{host.name}</h3>
                    <p className="text-sm text-stone-500">{host.email} • {host.listings?.length || 0} annonce(s)</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500">
              <p>Vous n'avez pas encore parrainé d'utilisateur.</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  )
}

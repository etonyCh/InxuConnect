import Header from '@/components/Header'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import B2bDashboard from '@/components/B2bDashboard'

export default async function B2bPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const token = (session as any).accessToken || ''

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Portail B2B Entreprises & ONG</h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Gérez les voyages de vos collaborateurs, configurez vos politiques de remboursement et accédez à vos factures consolidées.
          </p>
        </div>

        <B2bDashboard token={token} />
      </div>
    </main>
  )
}

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const token = (session as any).accessToken || ''

  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col justify-between">
      <div>
        <Header />
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Paramètres du Compte</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Modifiez vos informations personnelles, changez votre rôle et configurez les services de confiance.
            </p>
          </div>

          <SettingsForm token={token} initialUser={{
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            role: (session.user as any).role || 'GUEST'
          }} />
        </div>
      </div>
      
      <Footer />
    </main>
  )
}

import Header from '@/components/Header'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import crypto from 'crypto'
import BookingCard from '@/components/BookingCard'

// Helper pour générer un JWT temporaire signé pour le compte Hôte de test
// Cela permet de simuler le scan du QR Code par l'hôte directement depuis l'interface voyageur
function generateHostToken() {
  const header = { alg: 'HS256', typ: 'JWT' }
  const base64Url = (str: string) => Buffer.from(str).toString('base64url')
  const tokenHeader = base64Url(JSON.stringify(header))
  const tokenPayload = base64Url(JSON.stringify({ id: 'user_host_1', role: 'HOST' }))
  
  const secret = process.env.JWT_SECRET || 'inzuconnect-jwt-secret-dev-2026'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${tokenHeader}.${tokenPayload}`)
    .digest('base64url')
    
  return `${tokenHeader}.${tokenPayload}.${signature}`
}

async function getBookings(userId: string, token: string) {
  const res = await fetch(`http://localhost:3001/api/bookings/user/${userId}`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) return []
  return res.json()
}

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }
  
  const token = (session as any).accessToken || ''
  const bookings = await getBookings(session.user.id, token)
  const hostToken = generateHostToken()

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Mes réservations</h1>
          <p className="mt-1.5 text-sm text-stone-500">Gérez vos séjours, vos factures et vos codes de check-in.</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white border border-stone-200/60 rounded-2xl p-12 text-center shadow-sm">
            <div className="h-14 w-14 rounded-full bg-stone-50 border border-stone-200/50 flex items-center justify-center text-2xl mx-auto mb-4">
              📅
            </div>
            <h3 className="text-base font-bold text-stone-800">Aucune réservation active</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-normal">
              Vous n'avez pas encore réservé de logement. Trouvez l'appartement ou la villa idéale pour vos déplacements.
            </p>
            <Link 
              href="/" 
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors shadow-sm cursor-pointer"
            >
              Explorer les logements &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b: any) => (
              <BookingCard 
                key={b.id} 
                booking={b} 
                hostToken={hostToken} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

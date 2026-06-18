'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-stone-200/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-0.5 group">
          <span className="text-xl font-extrabold text-stone-900 tracking-tight transition-colors group-hover:text-emerald-950">Inzu</span>
          <span className="text-xl font-extrabold text-emerald-700 tracking-tight transition-colors group-hover:text-emerald-600">Connect</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1"></span>
        </Link>

        {/* Center Navbar */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
            Nos logements
          </Link>
          
          {session ? (
            <>
              {(session.user as any)?.role === 'HOST' && (
                <>
                  <Link href="/host/dashboard" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                    Tableau de Bord
                  </Link>
                  <Link href="/host/properties/new" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                    Ajouter une annonce
                  </Link>
                  <Link href="/bookings" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                    Mes voyages
                  </Link>
                </>
              )}

              {(session.user as any)?.role === 'AGENT' && (
                <Link href="/agent/dashboard" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                  Espace Agent
                </Link>
              )}

              {(session.user as any)?.role === 'ADMIN' && (
                <Link href="/admin/dashboard" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                  Administration
                </Link>
              )}

              {(session.user as any)?.role === 'GUEST' && (
                <>
                  <Link href="/bookings" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                    Mes réservations
                  </Link>
                  <Link href="/b2b" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                    Espace B2B
                  </Link>
                </>
              )}
            </>
          ) : null}
        </nav>

        {/* Right side user info / login */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2 group cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                      {((session.user as any)?.role === 'GUEST') ? 'Guest' : (((session.user as any)?.role || '').toString().charAt(0).toUpperCase() + ((session.user as any)?.role || '').toString().slice(1).toLowerCase() || 'User')}
                    </span>
                </div>
                <div className="h-8 w-8 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center text-xs font-black text-emerald-800 group-hover:bg-emerald-50 transition-all shadow-sm">
                  {session.user?.name ? session.user.name[0].toUpperCase() : 'C'}
                </div>
              </Link>
              <button 
                onClick={() => signOut()} 
                className="text-sm font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 px-4 py-1.5 rounded-full border border-stone-300 transition-all shadow-sm cursor-pointer"
              >
                Quitter
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors"
              >
                Connexion
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4.5 py-2 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
              >
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-stone-200/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-0.5 group">
          <span className="text-xl font-extrabold text-stone-900 tracking-tight transition-colors group-hover:text-emerald-950">Inzu</span>
          <span className="text-xl font-extrabold text-emerald-700 tracking-tight transition-colors group-hover:text-emerald-600">Connect</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1"></span>
        </Link>

        <div className="flex items-center gap-6">
          {session ? (
            <>
              <Link 
                href="/bookings" 
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                Mes réservations
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l border-stone-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-stone-800">{session.user?.name}</span>
                  <span className="text-[10px] text-stone-400 font-medium capitalize">{session.user?.role?.toLowerCase()}</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-800 border border-emerald-200">
                  {session.user?.name ? session.user.name[0].toUpperCase() : 'U'}
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 transition-all cursor-pointer"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center rounded-xl bg-emerald-800 hover:bg-emerald-900 px-4.5 py-2 text-sm font-semibold text-white shadow-sm transition-all primary-gradient hover:primary-gradient-hover cursor-pointer"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

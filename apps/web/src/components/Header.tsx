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
            Logements
          </Link>
          {session && (
            <>
              <Link href="/bookings" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                Mes séjours
              </Link>
              <Link href="/b2b" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                Espace B2B
              </Link>
              <Link href="/settings" className="text-sm font-bold text-stone-600 hover:text-emerald-800 transition-colors">
                Paramètres
              </Link>
            </>
          )}
        </nav>

        {/* Right side user info / login */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="flex items-center gap-2 group cursor-pointer">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-800 transition-colors">{session.user?.name}</span>
                  <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">{session.user?.role}</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-800 border border-emerald-250/30 group-hover:bg-emerald-200 transition-all">
                  {session.user?.name ? session.user.name[0].toUpperCase() : 'U'}
                </div>
              </Link>
              <button 
                onClick={() => signOut()} 
                className="text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/65 px-3 py-2 rounded-xl border border-stone-200/50 transition-all cursor-pointer"
              >
                Quitter
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center rounded-xl bg-emerald-800 hover:bg-emerald-950 px-4.5 py-2 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

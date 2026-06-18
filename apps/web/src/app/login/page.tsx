'use client'
import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const isRegistered = searchParams?.get('registered') === 'true'
  
  const [email, setEmail] = useState(isRegistered ? '' : 'guest@inzu.bi')
  const [password, setPassword] = useState(isRegistered ? '' : 'demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await signIn('credentials', {
        email, password, redirect: false
      })
      if (!res?.error) {
        router.push('/')
      } else {
        setError('Identifiants invalides')
      }
    } catch (err) {
      setError('Erreur lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-4">
      {/* Back to Home Link */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-850 transition-colors">
        &larr; Retour à l'accueil
      </Link>

      <div className="bg-white border border-stone-200/60 rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-lg space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-0.5 group">
            <span className="text-2xl font-black text-stone-900 tracking-tight">Inzu</span>
            <span className="text-2xl font-black text-emerald-700 tracking-tight">Connect</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1"></span>
          </div>
          <p className="text-sm text-stone-500 font-medium">Connectez-vous pour louer ou réserver</p>
        </div>

        {/* Success alert */}
        {isRegistered && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs font-semibold text-emerald-800">
            🎉 Inscription réussie ! Vous pouvez maintenant vous connecter.
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs font-semibold text-rose-800">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Adresse Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-xl bg-emerald-800 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition-all primary-gradient hover:primary-gradient-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Demo Accounts Card */}
        <div className="rounded-2xl bg-stone-50 border border-stone-150/70 p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wide">
            🔑 Comptes de démonstration
          </div>
          <div className="space-y-2 text-xs text-stone-500 font-medium">
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-200/50">
              <div>
                <span className="font-bold text-emerald-800 mr-1.5">[Guest]</span> guest@inzu.bi
              </div>
              <button 
                type="button" 
                onClick={() => { setEmail('guest@inzu.bi'); setPassword('demo123') }} 
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Remplir
              </button>
            </div>
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-stone-200/50">
              <div>
                <span className="font-bold text-emerald-800 mr-1.5">[Host]</span> host@inzu.bi
              </div>
              <button 
                type="button" 
                onClick={() => { setEmail('host@inzu.bi'); setPassword('demo123') }} 
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                Remplir
              </button>
            </div>
            <div className="text-[10px] text-stone-400 text-center pt-1.5">
              Mot de passe commun : <code className="font-mono bg-stone-200/60 px-1 py-0.5 rounded text-stone-700 font-bold">demo123</code>
            </div>
          </div>
        </div>

        {/* Redirect Link */}
        <div className="text-center text-xs text-stone-500 font-medium pt-2 border-t border-stone-100">
          Pas encore inscrit ?{' '}
          <Link href="/register" className="font-bold text-emerald-800 hover:text-emerald-950 transition-colors">
            Créer un compte
          </Link>
        </div>

      </div>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-stone-200/60 rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-lg flex items-center justify-center min-h-[300px]">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent"></span>
        </div>
      </main>
    }>
      <LoginFormContent />
    </Suspense>
  )
}

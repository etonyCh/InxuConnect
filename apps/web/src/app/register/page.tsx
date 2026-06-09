'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'GUEST' | 'HOST' | 'AGENT'>('GUEST')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
          role
        })
      })

      const data = await res.json() as any
      if (res.ok && data.success) {
        router.push('/login?registered=true')
      } else {
        setError(data.error || "Une erreur est survenue lors de l'inscription")
      }
    } catch (err) {
      setError("Connexion au serveur impossible")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50/50 flex flex-col items-center justify-center p-4 py-12">
      {/* Back to Home Link */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-850 transition-colors">
        &larr; Retour à l'accueil
      </Link>

      <div className="bg-white border border-stone-200/60 rounded-2xl p-8 sm:p-10 w-full max-w-[460px] shadow-lg space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-0.5 group">
            <span className="text-2xl font-black text-stone-900 tracking-tight">Inzu</span>
            <span className="text-2xl font-black text-emerald-700 tracking-tight">Connect</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1"></span>
          </div>
          <p className="text-sm text-stone-500 font-medium">Créez votre compte de confiance</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs font-semibold text-rose-800">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Nom Complet</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Marie Niyonzima"
              required
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Adresse Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="marie@inzu.bi"
              required
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Téléphone Mobile Money (Optionnel)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="ex: +257 79 123 456"
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Rôle souhaité</label>
            <div className="relative">
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none appearance-none cursor-pointer font-medium"
              >
                <option value="GUEST">Voyageur (Guest)</option>
                <option value="HOST">Hôte Propriétaire (Host)</option>
                <option value="AGENT">Agent Communautaire (Agent)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-500 font-bold">
                ▼
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
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
                Création du compte...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        {/* Redirect Link */}
        <div className="text-center text-xs text-stone-500 font-medium pt-2 border-t border-stone-100">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-bold text-emerald-800 hover:text-emerald-950 transition-colors">
            Se connecter
          </Link>
        </div>

      </div>
    </main>
  )
}

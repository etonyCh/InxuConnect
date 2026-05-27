'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'GUEST' | 'HOST' | 'AGENT' | 'ADMIN'
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  badge: 'NONE' | 'VERIFIED' | 'FIABLE' | 'SUPERHOST'
  microSavingsEnabled: boolean
  savingsBalance: number
}

interface SettingsFormProps {
  token: string
  initialUser: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function SettingsForm({ token, initialUser }: SettingsFormProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState(initialUser.name)
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState(initialUser.role)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [kycLoading, setKycLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name)
        setPhone(data.user.phone || '')
        setRole(data.user.role)
      }
    } catch (e) {
      console.error('Erreur lors du chargement du profil:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    try {
      const res = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, role })
      })

      if (res.ok) {
        setMsg({ type: 'success', text: 'Profil mis à jour avec succès !' })
        fetchProfile()
        // Refresh session
        router.refresh()
      } else {
        const err = await res.json()
        setMsg({ type: 'error', text: err.error || 'Erreur lors de l\'enregistrement' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Impossible de se connecter au serveur API' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSavings = async () => {
    if (!profile) return
    try {
      const res = await fetch('http://localhost:3001/api/host/savings/toggle', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchProfile()
      }
    } catch (e) {
      console.error('Erreur lors du basculement de l\'épargne:', e)
    }
  }

  const handleSimulateKyc = async () => {
    if (!profile) return
    setKycLoading(true)
    setMsg(null)

    try {
      // 1. Soumettre KYC PENDING
      const submitRes = await fetch('http://localhost:3001/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cniUrl: 'https://r2.inzuconnect.com/cni_test.jpg',
          selfieUrl: 'https://r2.inzuconnect.com/selfie_test.jpg'
        })
      })

      if (!submitRes.ok) throw new Error('Échec soumission')

      // 2. Simuler approbation webhook
      const webhookRes = await fetch('http://localhost:3001/api/kyc/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          result: 'APPROVED'
        })
      })

      if (webhookRes.ok) {
        setMsg({ type: 'success', text: 'Identité KYC validée avec succès par Smile Identity !' })
        fetchProfile()
        router.refresh()
      } else {
        throw new Error('Échec validation webhook')
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Erreur lors de la simulation KYC' })
    } finally {
      setKycLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-800" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Forms Section */}
      <div className="md:col-span-2 space-y-6">
        <form onSubmit={handleSave} className="bg-white border border-stone-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-stone-900 border-b border-stone-100 pb-3">Informations Personnelles</h3>
          
          {msg && (
            <div className={`p-4 rounded-xl text-xs font-semibold ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-red-50 text-red-800 border border-red-150'}`}>
              {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nom Complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-stone-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Adresse Email</label>
              <input
                type="email"
                value={profile?.email || initialUser.email}
                className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-500 font-medium cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Téléphone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+257 79 XXXXXX"
                className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-stone-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-medium text-stone-800"
              >
                <option value="GUEST">Voyageur (Guest)</option>
                <option value="HOST">Propriétaire (Host)</option>
                <option value="AGENT">Agent Communautaire</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-md"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* Badges and Settings sidebar */}
      <div className="space-y-6">
        {/* Verification Status */}
        <div className="bg-white border border-stone-200/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">Statut de Confiance</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{profile?.kycStatus === 'VERIFIED' ? '🏆' : '🔒'}</span>
              <div>
                <span className="block text-xs text-stone-400 font-bold uppercase">KYC Identité</span>
                <span className={`text-sm font-extrabold ${profile?.kycStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {profile?.kycStatus === 'VERIFIED' ? 'Vérifié' : profile?.kycStatus === 'PENDING' ? 'En cours d\'examen' : 'Non Soumis'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🏷️</span>
              <div>
                <span className="block text-xs text-stone-400 font-bold uppercase">Badge de Confiance</span>
                <span className="text-sm font-extrabold text-stone-800">{profile?.badge || 'NONE'}</span>
              </div>
            </div>

            {profile?.kycStatus !== 'VERIFIED' && (
              <button
                onClick={handleSimulateKyc}
                disabled={kycLoading}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                {kycLoading ? 'Traitement Smile ID...' : 'Simuler Validation Identité (Smile ID)'}
              </button>
            )}
          </div>
        </div>

        {/* Micro-Savings Panel (For Hosts) */}
        {profile?.role === 'HOST' && (
          <div className="bg-gradient-to-br from-emerald-850 to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 border border-white/10 mb-1">
                  💰 Épargne Bloquée
                </span>
                <h4 className="text-xs text-emerald-200/80 font-semibold uppercase tracking-wider">Cagnotte Hôte</h4>
                <p className="text-2xl font-black text-white mt-1">{profile.savingsBalance.toLocaleString()} BIF</p>
              </div>
              <span className="text-2xl">🏦</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <span className="block text-xs font-bold text-white">Micro-Épargne (10%)</span>
                <span className="text-[10px] text-emerald-300/80">Retenue automatique sur nuitées</span>
              </div>
              
              {/* Toggle Switch */}
              <button 
                type="button"
                onClick={handleToggleSavings}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profile.microSavingsEnabled ? 'bg-emerald-500' : 'bg-stone-700'}`}
              >
                <span 
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.microSavingsEnabled ? 'translate-x-5' : 'translate-x-0'}`} 
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

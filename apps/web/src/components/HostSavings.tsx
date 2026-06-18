'use client'
import { useState, useEffect } from 'react'

interface HostSavingsProps {
  token: string
}

export default function HostSavings({ token }: HostSavingsProps) {
  const [savingsEnabled, setSavingsEnabled] = useState(false)
  const [balance, setBalance] = useState(0)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSavings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/host/savings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setSavingsEnabled(data.microSavingsEnabled)
        setBalance(data.savingsBalance)
      } else {
        const err = await res.json() as any
        setError(err.error || "Erreur de chargement de l'épargne.")
      }
    } catch (e) {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSavings()
  }, [token])

  const handleToggleSavings = async (newVal: boolean) => {
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/host/savings/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: newVal })
      })
      if (res.ok) {
        const data = await res.json()
        setSavingsEnabled(data.microSavingsEnabled)
        setSuccess(data.message)
      } else {
        const err = await res.json() as any
        setError(err.error || "Erreur lors de la modification de la micro-épargne.")
      }
    } catch (e) {
      setError('Erreur réseau.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setError('Veuillez spécifier un montant de retrait valide.')
      return
    }
    setActionLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/host/savings/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(withdrawAmount) })
      })
      const data = await res.json() as any
      if (res.ok) {
        setBalance(data.savingsBalance)
        setSuccess(data.message)
        setWithdrawAmount('')
      } else {
        setError(data.error || 'Erreur lors de la transaction de retrait.')
      }
    } catch (e) {
      setError('Erreur réseau.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm font-bold text-stone-500 animate-pulse">Chargement de votre compte d'épargne...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-stone-900">Micro-Épargne Lumicash</h2>
            <p className="text-xs text-stone-500 font-semibold">Accumulez 10% de vos nuitées et retirez à tout moment.</p>
          </div>
          <span className="text-3xl">🏦</span>
        </div>

        {error && <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 rounded-xl p-3">⚠️ {error}</p>}
        {success && <p className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-xl p-3">✅ {success}</p>}

        {/* Info Solde */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex justify-between items-center">
          <div>
            <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Votre Épargne InzuConnect</span>
            <span className="text-3xl font-black text-emerald-800">{balance.toLocaleString()} BIF</span>
          </div>
          <button 
            type="button"
            onClick={() => setWithdrawAmount(String(balance))}
            className="px-3.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Tout remplir
          </button>
        </div>

        {/* Toggle Option */}
        <div className="flex items-center justify-between p-4 border border-stone-100 rounded-2xl bg-stone-50/20">
          <div>
            <span className="block text-xs font-bold text-stone-800">Épargner 10% sur mes gains</span>
            <span className="block text-[10px] text-stone-400 font-medium">Bloquer automatiquement 10% sur chaque séjour validé.</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={savingsEnabled} 
              disabled={actionLoading}
              onChange={(e) => handleToggleSavings(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-800"></div>
          </label>
        </div>

        {/* Form Retrait */}
        <form onSubmit={handleWithdraw} className="space-y-4 pt-4 border-t border-stone-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Montant du Retrait (BIF)</label>
            <input 
              type="number" 
              placeholder="ex: 50000" 
              value={withdrawAmount} 
              disabled={actionLoading}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/20"
            />
          </div>

          <button 
            type="submit" 
            disabled={actionLoading || !withdrawAmount || Number(withdrawAmount) <= 0}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? 'Traitement en cours...' : 'Demander le Retrait vers Mobile Money'}
          </button>
        </form>
      </div>
    </div>
  )
}

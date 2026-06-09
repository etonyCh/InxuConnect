'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KycActionButtons({ kycId, token }: { kycId: string, token: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!confirm(`Êtes-vous sûr de vouloir ${status === 'VERIFIED' ? 'approuver' : 'rejeter'} cette requête KYC ?`)) return
    
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3001/api/admin/kyc/${kycId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert("Erreur lors de la mise à jour")
      }
    } catch (e) {
      alert("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        disabled={loading}
        onClick={() => handleReview('VERIFIED')}
        className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
      >
        ✅ Approuver
      </button>
      <button 
        disabled={loading}
        onClick={() => handleReview('REJECTED')}
        className="px-3 py-1 bg-rose-50 text-rose-700 text-sm font-bold rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
      >
        ❌ Rejeter
      </button>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function BookingForm({ listingId, price }: { listingId: string, price: number }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'ECOCASH' | 'LUMICASH'>('ECOCASH')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/listings/${listingId}/services`)
        if (res.ok) {
          const data = await res.json()
          setServices(data)
        }
      } catch (e) {
        console.error('Erreur lors du chargement des services:', e)
      }
    }
    fetchServices()
  }, [listingId])

  // Calculate days and total
  const days = (checkIn && checkOut) 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const nights = days > 0 ? days : 0
  const rawTotal = nights * price

  // Services calculation
  const servicesTotal = selectedServices.reduce((sum, serviceId) => {
    const s = services.find(item => item.id === serviceId)
    return sum + (s ? s.price : 0)
  }, 0)

  // 8% fee on lodging, 5% fee on services
  const lodgingServiceFee = nights > 0 ? Math.round(rawTotal * 0.08) : 0
  const additionalServicesFee = selectedServices.length > 0 ? Math.round(servicesTotal * 0.05) : 0
  const serviceFee = lodgingServiceFee + additionalServicesFee

  const total = rawTotal + servicesTotal + serviceFee

  const handleBooking = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!checkIn || !checkOut || nights <= 0) {
      alert('Sélectionnez des dates valides')
      return
    }
    if (!phone || phone.trim() === '') {
      alert('Veuillez renseigner votre numéro de téléphone Mobile Money')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          totalPrice: total,
          paymentMethod,
          phone: phone.trim(),
          serviceItemIds: selectedServices
        })
      })
      if (res.ok) {
        router.push('/bookings')
      } else {
        const errorData = await res.json() as any
        alert(`Erreur lors de la réservation: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (e) {
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Selectors */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Arrivée</label>
          <input 
            type="date" 
            value={checkIn} 
            onChange={e => setCheckIn(e.target.value)} 
            min={new Date().toISOString().split('T')[0]} 
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Départ</label>
          <input 
            type="date" 
            value={checkOut} 
            onChange={e => setCheckOut(e.target.value)} 
            min={checkIn || new Date().toISOString().split('T')[0]} 
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
          />
        </div>
      </div>

      {/* Services additionnels */}
      {nights > 0 && services.length > 0 && (
        <div className="space-y-3.5 border-t border-stone-100 pt-4">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Services Additionnels Proposés par l'Hôte 🧺🍽️
          </label>
          <div className="space-y-2.5">
            {services.map((s) => {
              const isChecked = selectedServices.includes(s.id)
              return (
                <label 
                  key={s.id} 
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked 
                      ? 'border-emerald-600 bg-emerald-50/20' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices([...selectedServices, s.id])
                        } else {
                          setSelectedServices(selectedServices.filter(id => id !== s.id))
                        }
                      }}
                      className="mt-0.5 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700 h-4 w-4"
                    />
                    <div className="-mt-0.5">
                      <span className="block text-xs font-bold text-stone-850">{s.name}</span>
                      <span className="block text-[11px] text-stone-400 font-medium leading-relaxed">{s.description}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-stone-700 whitespace-nowrap ml-4">
                    {s.price.toLocaleString()} BIF
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Payment Method Selector */}
      {nights > 0 && (
        <div className="space-y-3.5 border-t border-stone-100 pt-4">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">Mode de Paiement</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('ECOCASH')}
              className={`px-4 py-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === 'ECOCASH'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-100'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
              }`}
            >
              <span className="text-lg">📲</span>
              <span>EcoCash</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('LUMICASH')}
              className={`px-4 py-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === 'LUMICASH'
                  ? 'border-amber-600 bg-amber-50/40 text-amber-950 ring-2 ring-amber-100'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
              }`}
            >
              <span className="text-lg">⚡</span>
              <span>Lumicash</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-650 uppercase tracking-wider mb-2">Numéro Mobile Money (+257...)</label>
            <input 
              type="tel" 
              placeholder="+257 79 000 000"
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4.5 py-3 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
            />
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      {nights > 0 && (
        <div className="rounded-xl bg-stone-50 border border-stone-150 p-4.5 space-y-3.5 text-sm">
          <div className="flex justify-between text-stone-600 font-medium">
            <span>{price.toLocaleString()} FBu &times; {nights} nuits</span>
            <span className="text-stone-900 font-semibold">{rawTotal.toLocaleString()} FBu</span>
          </div>

          {selectedServices.length > 0 && (
            <div className="flex justify-between text-stone-600 font-medium border-t border-dashed border-stone-200 pt-2">
              <span>Services additionnels</span>
              <span className="text-stone-900 font-semibold">{servicesTotal.toLocaleString()} FBu</span>
            </div>
          )}

          <div className="flex justify-between text-stone-600 font-medium border-t border-dashed border-stone-200 pt-2">
            <span>Frais de service InzuConnect</span>
            <span className="text-stone-900 font-semibold" title={`Logement: ${lodgingServiceFee.toLocaleString()} FBu (8%) | Services: ${additionalServicesFee.toLocaleString()} FBu (5%)`}>
              {serviceFee.toLocaleString()} FBu
            </span>
          </div>

          <div className="pt-3 border-t border-stone-250 flex justify-between text-stone-900 font-extrabold text-base">
            <span>Total avec frais</span>
            <span className="text-emerald-800">{total.toLocaleString()} FBu</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button 
        onClick={handleBooking} 
        disabled={loading || !!(checkIn && checkOut && nights <= 0)} 
        className="w-full rounded-xl bg-emerald-800 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition-all primary-gradient hover:primary-gradient-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Réservation...
          </span>
        ) : session ? (
          'Réserver maintenant'
        ) : (
          'Se connecter pour réserver'
        )}
      </button>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ChatDialog from './ChatDialog'
import ReviewForm from './ReviewForm'

interface BookingCardProps {
  booking: any;
  hostToken: string;
}

export default function BookingCard({ booking: b, hostToken }: BookingCardProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [showHostForm, setShowHostForm] = useState(false)
  const [sosLoading, setSosLoading] = useState(false)
  const [sosMessage, setSosMessage] = useState<string | null>(null)
  const [showSOSConfirm, setShowSOSConfirm] = useState(false)

  const guestToken = (session as any)?.accessToken || ''
  const guestUserId = session?.user?.id || ''

  const loadReviews = async () => {
    if (b.status !== 'CHECKED_IN' && b.status !== 'COMPLETED') return
    setLoadingReviews(true)
    try {
      const tokenToUse = guestToken || hostToken
      const res = await fetch(`http://localhost:3001/api/bookings/${b.id}/reviews`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      })
      if (res.ok) {
        const data = await res.json() as any[]
        setReviews(data)
      }
    } catch (e) {
      console.error('Erreur lors du chargement des avis:', e)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [b.id, b.status])

  const triggerSOS = async () => {
    setSosLoading(true)
    setSosMessage(null)
    
    const sendSOSRequest = async (lat?: number, lng?: number) => {
      try {
        const tokenToUse = guestToken || hostToken
        const res = await fetch(`http://localhost:3001/api/bookings/${b.id}/sos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenToUse}`
          },
          body: JSON.stringify({ latitude: lat, longitude: lng })
        })

        const data = await res.json() as any
        if (res.ok) {
          setSosMessage('🚨 Alerte SOS envoyée avec succès par SMS à l\'autre participant et notifiée aux secours !')
          setShowSOSConfirm(false)
        } else {
          setSosMessage(`⚠️ Erreur : ${data.error || 'Impossible d\'envoyer le SOS.'}`)
        }
      } catch (err) {
        setSosMessage('⚠️ Erreur réseau lors de l\'envoi du SOS.')
      } finally {
        setSosLoading(false)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendSOSRequest(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.warn("Géolocalisation refusée ou indisponible, envoi du SOS sans coordonnées GPS.", error)
          sendSOSRequest()
        },
        { timeout: 5000 }
      )
    } else {
      console.warn("Géolocalisation non supportée par le navigateur, envoi sans coordonnées GPS.")
      sendSOSRequest()
    }
  }

  const checkInDate = new Date(b.checkIn).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  const checkOutDate = new Date(b.checkOut).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  // Simuler le paiement mobile money via l'agrégateur InTouch (EcoCash/Lumicash callback)
  const simulatePayment = async () => {
    if (!b.payment?.reference) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/payments/mock-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: b.payment.reference,
          status: 'SUCCESS'
        })
      })

      if (res.ok) {
        window.location.reload()
      } else {
        alert('Échec de la simulation du paiement')
      }
    } catch (e) {
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // Simuler le scan du QR Code de check-in par l'hôte
  const simulateCheckIn = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${b.id}/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hostToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const err = await res.json() as any
        alert(`Échec du check-in: ${err.error || 'Erreur inconnue'}`)
      }
    } catch (e) {
      alert('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // Badge styles
  const getStatusBadge = () => {
    switch (b.status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 ring-1 ring-amber-500/20';
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/20';
      case 'CHECKED_IN':
        return 'bg-blue-50 text-blue-800 ring-1 ring-blue-500/20';
      case 'CANCELLED':
        return 'bg-stone-100 text-stone-600 ring-1 ring-stone-500/10';
      default:
        return 'bg-stone-50 text-stone-700 ring-1 ring-stone-500/10';
    }
  };

  const getPaymentBadge = () => {
    if (!b.payment) return null;
    switch (b.payment.status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 ring-1 ring-amber-500/20';
      case 'ESCROWED':
        return 'bg-teal-50 text-teal-800 ring-1 ring-teal-500/20';
      case 'PAID_OUT':
        return 'bg-blue-50 text-blue-850 ring-1 ring-blue-500/20';
      case 'FAILED':
        return 'bg-red-50 text-red-800 ring-1 ring-red-500/10';
      default:
        return 'bg-stone-50 text-stone-700';
    }
  };

  const getPaymentLabel = () => {
    if (!b.payment) return 'Non défini';
    switch (b.payment.status) {
      case 'PENDING': return 'Paiement Attendu';
      case 'ESCROWED': return 'Sécurisé en Escrow 🔒';
      case 'PAID_OUT': return 'Transféré à l\'Hôte 💸';
      case 'FAILED': return 'Échoué';
      default: return b.payment.status;
    }
  };

  return (
    <div className="bg-white border border-stone-200/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm hover:border-stone-300 transition-all">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        
        {/* Core details */}
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadge()}`}>
                {b.status}
              </span>
              {b.payment && (
                <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getPaymentBadge()}`}>
                  {getPaymentLabel()}
                </span>
              )}
              <span className="text-xs text-stone-400 font-semibold">Ref: #{b.id.substring(0, 8)}</span>
            </div>
            
            <h3 className="text-xl font-bold text-stone-900 hover:text-emerald-800 transition-colors">
              {b.listing?.title || 'Logement'}
            </h3>
            <p className="text-sm font-medium text-stone-500 mt-1">
              📍 {b.listing?.city} &bull; {b.listing?.address || 'Adresse non spécifiée'}
            </p>
          </div>

          {/* Date blocks */}
          <div className="flex items-center gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3 border border-stone-150/50 w-fit">
            <div>
              <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wide">Arrivée</span>
              <span className="font-semibold text-stone-700">{checkInDate}</span>
            </div>
            <div className="text-stone-300 font-light text-xl">&rarr;</div>
            <div>
              <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wide">Départ</span>
              <span className="font-semibold text-stone-700">{checkOutDate}</span>
            </div>
          </div>

          {/* Payment Method details */}
          {b.payment && (
            <div className="text-xs text-stone-500 font-medium">
              Mode : <span className="font-bold text-stone-700">{b.payment.provider}</span> &bull; Réf transaction InTouch : <span className="font-mono text-stone-700">{b.payment.reference}</span>
            </div>
          )}
        </div>

        {/* Pricing and core actions */}
        <div className="flex flex-col items-start lg:items-end justify-center gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-100">
          <div className="w-full lg:text-right">
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wide mb-1">Montant total</span>
            <div className="text-2xl font-black text-emerald-800 flex items-baseline gap-0.5">
              <span>{b.totalPrice.toLocaleString()}</span>
              <span className="text-sm font-bold text-stone-500">FBu</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Show QR button if escrowed */}
            {b.payment?.status === 'ESCROWED' && (
              <button 
                onClick={() => setShowQR(!showQR)}
                className="h-10 px-4 rounded-xl border border-stone-200 flex items-center justify-center gap-1.5 text-xs font-bold bg-stone-50 hover:bg-stone-100 transition-colors shadow-sm cursor-pointer"
                title="Afficher le QR Code Check-in"
              >
                <span>{showQR ? 'Masquer QR' : 'Afficher QR'}</span>
                <span>📱</span>
              </button>
            )}
            {b.status === 'CHECKED_IN' && (
              <button 
                type="button"
                onClick={() => setShowSOSConfirm(true)}
                className="rounded-xl border border-red-250 bg-red-650 hover:bg-red-800 text-xs font-bold text-white px-4 py-2.5 shadow-sm transition-colors cursor-pointer h-10 flex items-center gap-1.5"
                title="Déclencher une alerte SOS"
              >
                <span>SOS 🚨</span>
              </button>
            )}
            <button 
              type="button"
              onClick={() => setShowChat(true)}
              className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-600 px-4 py-2.5 shadow-sm transition-colors cursor-pointer h-10 flex items-center gap-1.5"
            >
              <span>Discussion</span>
              <span>💬</span>
            </button>
            <Link 
              href={`/property/${b.listingId}`}
              className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-600 px-4 py-2.5 shadow-sm transition-colors cursor-pointer h-10 flex items-center"
            >
              Logement
            </Link>
          </div>
        </div>

      </div>

      {/* Interactive Simulation Dashboard & QR Code section */}
      {(b.payment?.status === 'PENDING' || (b.payment?.status === 'ESCROWED' && showQR)) && (
        <div className="pt-5 border-t border-stone-100/70 bg-stone-50/50 rounded-2xl p-4.5 border border-stone-200/50 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold tracking-wider uppercase">Console Dev</span>
            <h4 className="text-xs font-bold text-stone-700">Simulateur Mobile Money & Escrow</h4>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-center">
            {/* EcoCash / Lumicash Pending Payment simulator */}
            {b.payment?.status === 'PENDING' && (
              <div className="flex-1 space-y-2">
                <p className="text-xs text-stone-500 leading-relaxed">
                  Cette réservation est en attente de validation de transaction sur le réseau mobile money du Burundi ({b.payment.provider}).
                </p>
                <button
                  onClick={simulatePayment}
                  disabled={loading}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? 'Traitement...' : `Valider la transaction ${b.payment.provider} (Callback InTouch)`}
                </button>
              </div>
            )}

            {/* Check-in QR Code and Host Scan Simulator */}
            {b.payment?.status === 'ESCROWED' && showQR && (
              <>
                {/* Styled Vector QR Code */}
                <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm">
                  <svg width="130" height="130" viewBox="0 0 100 100" className="bg-white">
                    <rect x="5" y="5" width="25" height="25" fill="#115e59" stroke="white" strokeWidth="2" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="13" y="13" width="9" height="9" fill="#115e59" />

                    <rect x="70" y="5" width="25" height="25" fill="#115e59" stroke="white" strokeWidth="2" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="78" y="13" width="9" height="9" fill="#115e59" />

                    <rect x="5" y="70" width="25" height="25" fill="#115e59" stroke="white" strokeWidth="2" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="13" y="78" width="9" height="9" fill="#115e59" />

                    <rect x="35" y="10" width="5" height="5" fill="#115e59" />
                    <rect x="45" y="5" width="10" height="5" fill="#115e59" />
                    <rect x="40" y="15" width="5" height="10" fill="#115e59" />
                    <rect x="55" y="15" width="5" height="5" fill="#115e59" />
                    <rect x="60" y="10" width="5" height="10" fill="#115e59" />

                    <rect x="10" y="35" width="5" height="5" fill="#115e59" />
                    <rect x="5" y="45" width="10" height="5" fill="#115e59" />
                    <rect x="15" y="40" width="5" height="10" fill="#115e59" />
                    <rect x="15" y="55" width="5" height="5" fill="#115e59" />
                    <rect x="10" y="60" width="5" height="10" fill="#115e59" />

                    <rect x="35" y="35" width="30" height="30" fill="none" stroke="#115e59" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="50" cy="50" r="10" fill="#115e59" opacity="0.1" />
                    <path d="M45,45 L55,45 L55,55 L45,55 Z" fill="#115e59" />

                    <rect x="70" y="35" width="10" height="10" fill="#115e59" />
                    <rect x="85" y="40" width="10" height="5" fill="#115e59" />
                    <rect x="80" y="50" width="5" height="15" fill="#115e59" />
                    <rect x="75" y="60" width="10" height="5" fill="#115e59" />

                    <rect x="35" y="70" width="10" height="10" fill="#115e59" />
                    <rect x="40" y="85" width="10" height="5" fill="#115e59" />
                    <rect x="50" y="80" width="5" height="15" fill="#115e59" />
                    <rect x="60" y="75" width="10" height="5" fill="#115e59" />
                    
                    <rect x="75" y="75" width="10" height="10" fill="#115e59" />
                    <rect x="78" y="78" width="4" height="4" fill="white" />
                    <rect x="79" y="79" width="2" height="2" fill="#115e59" />
                  </svg>
                  <span className="text-[10px] font-mono text-stone-400 select-all">Ref: #{b.id.substring(0, 10)}</span>
                </div>

                <div className="flex-1 space-y-2.5">
                  <h5 className="text-xs font-bold text-stone-800">Check-in et libération de l'Escrow</h5>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Les fonds sont actuellement séquestrés de manière sécurisée par InzuConnect. Présentez ce QR Code à l'hôte lors de votre arrivée.
                  </p>
                  <button
                    onClick={simulateCheckIn}
                    disabled={loading}
                    className="rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? 'Check-in...' : 'Simuler Scan Hôte (Valider Check-in & Payout)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Section des Avis (Double-blind) */}
      {(b.status === 'CHECKED_IN' || b.status === 'COMPLETED') && (
        <div className="pt-6 border-t border-stone-100/70 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-850 flex items-center gap-1.5">
              <span>Avis et Évaluations</span>
              <span className="text-[10px] bg-teal-50 text-teal-850 rounded-full px-2 py-0.5 font-bold tracking-wide uppercase border border-teal-200">
                🔒 Double-Blind
              </span>
            </h4>
            
            {/* Boutons d'action pour écrire des avis */}
            <div className="flex items-center gap-2">
              {!reviews.some(r => r.authorId === b.guestId) && !showGuestForm && (
                <button
                  onClick={() => setShowGuestForm(true)}
                  className="rounded-xl border border-emerald-250 hover:bg-emerald-50 text-xs font-bold text-emerald-800 px-3 py-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  Laisser un avis (Voyageur)
                </button>
              )}
            </div>
          </div>

          {/* Affichage des formulaires d'avis */}
          {showGuestForm && (
            <ReviewForm
              bookingId={b.id}
              token={guestToken}
              roleLabel="Voyageur"
              onSuccess={() => {
                setShowGuestForm(false)
                loadReviews()
              }}
              onCancel={() => setShowGuestForm(false)}
            />
          )}

          {showHostForm && (
            <ReviewForm
              bookingId={b.id}
              token={hostToken}
              roleLabel="Hôte (Simulation)"
              onSuccess={() => {
                setShowHostForm(false)
                loadReviews()
              }}
              onCancel={() => setShowHostForm(false)}
            />
          )}

          {/* Liste des avis existants */}
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => {
                const isRevealed = rev.revealedAt !== null
                
                return (
                  <div 
                    key={rev.id} 
                    className={`p-4 rounded-xl border ${
                      isRevealed 
                        ? 'bg-stone-50 border-stone-200/80 shadow-sm' 
                        : 'bg-amber-50/20 border-amber-200/40'
                    } space-y-2`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-700">
                        {rev.authorId === b.guestId ? 'Voyageur' : 'Hôte'}
                      </span>
                      {rev.rating !== null && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="text-sm">
                              {i < rev.rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                    {!isRevealed && (
                      <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                        <span>🔒 Double-Blind</span>
                        <span className="font-normal text-stone-400">&bull; Révélé dès que l'autre partie aura évalué.</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">Aucun avis soumis pour le moment.</p>
          )}

          {/* Console Dev pour simulation de l'hôte */}
          {!reviews.some(r => r.authorId === b.listing.ownerId) && !showHostForm && (
            <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-3 flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Console Dev : Évaluation en tant que l'Hôte de la réservation
              </span>
              <button
                onClick={() => setShowHostForm(true)}
                className="rounded-lg bg-stone-100 hover:bg-stone-250 text-[10px] font-bold text-stone-600 px-3 py-1 cursor-pointer"
              >
                Simuler l'avis Hôte
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dialogue de confirmation SOS & Messages d'alerte */}
      {showSOSConfirm && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
            <span>🚨 Déclencher une Alerte de Sécurité SOS ?</span>
          </h4>
          <p className="text-xs text-red-700 leading-relaxed">
            Cela enverra immédiatement un SMS d'urgence à l'autre participant avec vos coordonnées GPS pour lui signaler un problème grave et demander assistance.
          </p>
          <div className="flex gap-3">
            <button
              onClick={triggerSOS}
              disabled={sosLoading}
              className="rounded-xl bg-red-650 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 disabled:opacity-50 cursor-pointer"
            >
              {sosLoading ? 'Envoi...' : 'Confirmer et envoyer le SOS'}
            </button>
            <button
              onClick={() => setShowSOSConfirm(false)}
              disabled={sosLoading}
              className="rounded-xl bg-white border border-stone-250 text-stone-700 text-xs font-bold px-4 py-2 cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {sosMessage && (
        <div className={`mt-4 p-4 rounded-xl border text-xs font-bold ${
          sosMessage.startsWith('🚨') 
            ? 'bg-red-50 border-red-200 text-red-800 animate-pulse' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {sosMessage}
        </div>
      )}

      {showChat && (
        <ChatDialog 
          bookingId={b.id} 
          guestToken={guestToken} 
          guestUserId={guestUserId} 
          hostToken={hostToken} 
          onClose={() => setShowChat(false)} 
        />
      )}
    </div>
  )
}

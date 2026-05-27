'use client'
import { useState } from 'react'

interface ReviewFormProps {
  bookingId: string
  token: string
  roleLabel: string
  onSuccess: () => void
  onCancel?: () => void
}

export default function ReviewForm({ bookingId, token, roleLabel, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>('')
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError('Veuillez rédiger un commentaire.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${bookingId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment: comment.trim() })
      })

      const data = await res.json() as any
      if (res.ok) {
        onSuccess()
      } else {
        setError(data.error || 'Une erreur est survenue.')
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-stone-850">
          Laisser un avis en tant que <span className="text-emerald-800">{roleLabel}</span>
        </h4>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
          >
            Annuler
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating selector */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wide">
            Note globale
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(null)}
                className="text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
              >
                <span className={
                  (hoveredRating !== null ? star <= hoveredRating : star <= rating)
                    ? 'text-amber-400'
                    : 'text-stone-300'
                }>
                  ★
                </span>
              </button>
            ))}
            <span className="text-xs font-bold text-stone-600 ml-2">
              {rating} / 5
            </span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1">
          <label htmlFor="comment-textarea" className="block text-xs font-bold text-stone-400 uppercase tracking-wide">
            Votre commentaire
          </label>
          <textarea
            id="comment-textarea"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Racontez votre expérience..."
            className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-800 focus:border-emerald-800 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-650 bg-red-50 p-2.5 rounded-lg border border-red-200">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold py-2.5 px-4 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Soumission...' : 'Soumettre mon avis'}
        </button>
      </form>
    </div>
  )
}

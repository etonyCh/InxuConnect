'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VoiceSearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Lecture des filtres actuels depuis l'URL
  const currentCity = searchParams.get('city') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentHasGenerator = searchParams.get('hasGenerator') === 'true'
  const currentHasWaterTank = searchParams.get('hasWaterTank') === 'true'
  const currentHasStarlink = searchParams.get('hasStarlink') === 'true'

  const [textQuery, setTextQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [equalizerHeights, setEqualizerHeights] = useState([20, 20, 20, 20, 20])
  const [speechSupported, setSpeechSupported] = useState(false)
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null)
  
  // Initialisation de la reconnaissance vocale native du navigateur (si dispo)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        const rec = new SpeechRecognition()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = 'fr-FR' // Mode principal français (Claude comprendra le Kirundi mixé)
        
        rec.onstart = () => {
          setVoiceStatus('Ndiko ndumviriza... / Écoute en cours...')
        }
        
        rec.onerror = () => {
          setVoiceStatus('Erreur de capture vocale.')
        }
        
        rec.onend = () => {
          setIsRecording(false)
        }
        
        rec.onresult = async (event: any) => {
          const resultText = event.results[0][0].transcript
          setVoiceStatus(`Traitement de : "${resultText}"...`)
          await submitTranscriptToBackend(resultText)
        }
        
        setRecognitionInstance(rec)
      }
    }
  }, [])

  // Animation de l'équiliseur de volume fictif lors de l'écoute
  useEffect(() => {
    let interval: any
    if (isRecording) {
      interval = setInterval(() => {
        setEqualizerHeights([
          Math.floor(Math.random() * 60) + 15,
          Math.floor(Math.random() * 70) + 15,
          Math.floor(Math.random() * 80) + 15,
          Math.floor(Math.random() * 70) + 15,
          Math.floor(Math.random() * 60) + 15,
        ])
      }, 100)
    } else {
      setEqualizerHeights([20, 20, 20, 20, 20])
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const startVoiceSearch = () => {
    setIsRecording(true)
    setVoiceStatus('Préparation du micro...')
    if (recognitionInstance) {
      try {
        recognitionInstance.start()
      } catch (e) {
        // Déjà démarré ou bloqué
      }
    } else {
      // Fallback si pas de support micro : simulation
      setVoiceStatus('Simulation micro (cliquez sur un exemple ci-dessous ou parlez)')
    }
  }

  const stopVoiceSearch = () => {
    setIsRecording(false)
    if (recognitionInstance) {
      recognitionInstance.stop()
    }
  }

  // Soumet la phrase décodée au backend NLP
  const submitTranscriptToBackend = async (transcript: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/ai/voice-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript })
      })

      if (res.ok) {
        const data = await res.json()
        const filters = data.filters
        applyFilters(filters)
      } else {
        alert('Erreur lors du décodage de la commande vocale par le serveur.')
      }
    } catch (e) {
      console.error('Erreur réseau lors de la commande vocale :', e)
    } finally {
      setIsRecording(false)
    }
  }

  // Simuler une commande vocale (très utile pour tests et démos)
  const handleSimulatedCommand = async (cmd: string) => {
    setVoiceStatus(`Simulation de : "${cmd}"...`)
    await submitTranscriptToBackend(cmd)
  };

  // Applique les filtres reçus à l'URL Next.js
  const applyFilters = (filters: any) => {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
    if (filters.hasGenerator) params.set('hasGenerator', 'true')
    if (filters.hasWaterTank) params.set('hasWaterTank', 'true')
    if (filters.hasStarlink) params.set('hasStarlink', 'true')
    
    router.push(`/?${params.toString()}`)
  }

  // Soumission manuelle de la recherche textuelle
  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textQuery.trim()) return
    // On simule comme une commande vocale textuelle pour décodage intelligent
    submitTranscriptToBackend(textQuery)
    setTextQuery('')
  }

  // Réinitialiser un filtre spécifique
  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`/?${params.toString()}`)
  }

  // Effacer tous les filtres
  const clearAllFilters = () => {
    router.push('/')
  }

  const hasAnyFilter = currentCity || currentMaxPrice || currentHasGenerator || currentHasWaterTank || currentHasStarlink

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Barre de recherche principale */}
      <form onSubmit={handleTextSearch} className="relative flex items-center bg-white border border-stone-200 rounded-2xl p-2 shadow-sm gap-2">
        <span className="pl-3 text-stone-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Recherche intelligente... (ex: inzu i Gitega munsi ya 30000 FBu)"
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-stone-850 p-2 placeholder-stone-400"
        />
        
        {/* Bouton Micro */}
        <button
          type="button"
          onClick={startVoiceSearch}
          className="p-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-red-100"
          title="Recherche Vocale (Kirundi / Français)"
          id="btn-voice-search"
        >
          🎙️
        </button>

        <button
          type="submit"
          className="px-5 py-2.5 bg-emerald-850 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Chercher
        </button>
      </form>

      {/* Rendu des filtres actifs */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-bold uppercase tracking-wider text-[10px]">Filtres :</span>
          {currentCity && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 rounded-lg px-2.5 py-1 font-bold border border-emerald-100">
              📍 Ville : {currentCity}
              <button type="button" onClick={() => clearFilter('city')} className="hover:text-red-700 cursor-pointer font-black ml-1">&times;</button>
            </span>
          )}
          {currentMaxPrice && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 rounded-lg px-2.5 py-1 font-bold border border-emerald-100">
              💰 Max : {parseInt(currentMaxPrice).toLocaleString()} BIF
              <button type="button" onClick={() => clearFilter('maxPrice')} className="hover:text-red-700 cursor-pointer font-black ml-1">&times;</button>
            </span>
          )}
          {currentHasGenerator && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 rounded-lg px-2.5 py-1 font-bold border border-emerald-100">
              🔋 Groupe Électrogène
              <button type="button" onClick={() => clearFilter('hasGenerator')} className="hover:text-red-700 cursor-pointer font-black ml-1">&times;</button>
            </span>
          )}
          {currentHasWaterTank && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 rounded-lg px-2.5 py-1 font-bold border border-emerald-100">
              💧 Citerne d'Eau
              <button type="button" onClick={() => clearFilter('hasWaterTank')} className="hover:text-red-700 cursor-pointer font-black ml-1">&times;</button>
            </span>
          )}
          {currentHasStarlink && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-850 rounded-lg px-2.5 py-1 font-bold border border-emerald-100">
              📡 Wi-Fi Starlink
              <button type="button" onClick={() => clearFilter('hasStarlink')} className="hover:text-red-700 cursor-pointer font-black ml-1">&times;</button>
            </span>
          )}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-stone-400 hover:text-stone-700 underline font-bold cursor-pointer ml-auto"
          >
            Tout réinitialiser
          </button>
        </div>
      )}

      {/* Overlay de capture vocale (Equalizer UI) */}
      {isRecording && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
            <h3 className="text-lg font-black text-stone-850">Assistant Vocal InzuConnect</h3>
            
            {/* Visualiseur d'ondes (Equalizer) */}
            <div className="flex items-end justify-center gap-1.5 h-24 my-4">
              {equalizerHeights.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-3.5 bg-emerald-800 rounded-full transition-all duration-100 animate-pulse"
                />
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-stone-800 animate-pulse">{voiceStatus}</p>
              <p className="text-[11px] text-stone-400 font-medium">Vous pouvez parler en Français, en Kirundi, ou mélanger les deux.</p>
            </div>

            {/* Liste de commandes simulées pour test et fallback */}
            <div className="space-y-2 border-t border-stone-100 pt-4 text-left">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Exemples de requêtes locales (cliquez pour simuler) :</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleSimulatedCommand('Je cherche une chambre i Gitega sous 30000 BIF avec generator')}
                  className="w-full text-left p-2 hover:bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 font-semibold truncate transition-colors cursor-pointer"
                >
                  🇧🇮 "Je cherche une chambre i Gitega sous 30000 BIF avec generator"
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedCommand('Ngozi inzu ifise moteri y\'umuriro')}
                  className="w-full text-left p-2 hover:bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 font-semibold truncate transition-colors cursor-pointer"
                >
                  🇧🇮 "Ngozi inzu ifise moteri y'umuriro"
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedCommand('Bujumbura pas cher avec Starlink')}
                  className="w-full text-left p-2 hover:bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 font-semibold truncate transition-colors cursor-pointer"
                >
                  🇧🇮 "Bujumbura pas cher avec Starlink"
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={stopVoiceSearch}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-650 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

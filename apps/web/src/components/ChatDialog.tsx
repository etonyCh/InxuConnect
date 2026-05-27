'use client'
import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  bodyOriginal: string;
  bodyTranslated: string;
  lang: 'FR' | 'RN';
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface ChatDialogProps {
  bookingId: string;
  guestToken: string;
  guestUserId: string;
  hostToken: string;
  onClose: () => void;
}

export default function ChatDialog({ bookingId, guestToken, guestUserId, hostToken, onClose }: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [lang, setLang] = useState<'FR' | 'RN'>('FR')
  const [loading, setLoading] = useState(false)
  const [simulateAsHost, setSimulateAsHost] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Détermination des tokens et IDs selon l'identité active
  const activeToken = simulateAsHost ? hostToken : guestToken;
  const currentUserId = simulateAsHost ? 'user_host_1' : guestUserId;

  // Templates pré-écrits bilingues
  const templates = {
    FR: [
      "Je suis en route.",
      "Quelle est l'adresse exacte ?",
      "Je suis arrivé.",
      "Est-ce qu'il y a du courant ?",
      "L'eau est coupée ?",
      "Merci beaucoup."
    ],
    RN: [
      "Ndi mu nzira.",
      "Ni he ryerekezo ry'inzu ryiza ?",
      "Nashitse.",
      "Umuriro urahari ?",
      "Amazi yakutse ?",
      "Murakoze cane."
    ]
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${bookingId}/messages`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      })
      if (res.ok) {
        const data = await res.json() as Message[]
        setMessages(data)
      }
    } catch (e) {
      console.error("Erreur chargement messages", e)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Rafraîchissement automatique toutes les 5 secondes
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [bookingId, simulateAsHost])

  useEffect(() => {
    // Fait défiler jusqu'au bas lors de la réception de nouveaux messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:3001/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          body: messageText.trim(),
          lang
        })
      })

      if (res.ok) {
        setText('')
        await fetchMessages()
      } else {
        alert("Erreur lors de l'envoi")
      }
    } catch (e) {
      alert("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-stone-200 w-full max-w-lg h-[600px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>Discussion de voyage</span>
              {hostToken && (
                <button
                  type="button"
                  onClick={() => setSimulateAsHost(!simulateAsHost)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer select-none ${
                    simulateAsHost ? 'bg-amber-600 text-white animate-pulse' : 'bg-white/20 text-emerald-250 hover:bg-white/30'
                  }`}
                  title="Permuter l'identité de l'expéditeur"
                >
                  {simulateAsHost ? 'Simuler Hôte' : 'Mode Voyageur'}
                </button>
              )}
            </h3>
            <p className="text-xs text-emerald-250/90 font-medium mt-0.5">
              Traduction instantanée &bull; Rôle actif : <span className="font-bold underline">{simulateAsHost ? 'Hôte' : 'Voyageur'}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
          {messages.length === 0 ? (
            <div className="text-center py-20 text-stone-400 space-y-2">
              <span className="text-3xl block">💬</span>
              <p className="text-xs font-semibold uppercase tracking-wider">Aucun message</p>
              <p className="text-xs max-w-[240px] mx-auto leading-normal">
                Envoyez un message ci-dessous. Il sera traduit automatiquement.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUserId
              const time = new Date(m.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-stone-400 font-bold mb-1 px-1">
                    {isMe ? 'Vous' : m.sender.name} &bull; {time}
                  </div>
                  
                  <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-sm border ${
                    isMe 
                      ? 'bg-emerald-800 border-emerald-900 text-white rounded-tr-none' 
                      : 'bg-white border-stone-200 text-stone-900 rounded-tl-none'
                  }`}>
                    {/* Message Original */}
                    <p className="text-sm font-medium leading-relaxed break-words">
                      {m.bodyOriginal}
                    </p>
                    
                    {/* Message Traduit */}
                    <div className={`pt-1.5 border-t text-xs flex items-start gap-1.5 leading-relaxed break-words ${
                      isMe ? 'border-emerald-700/60 text-emerald-200' : 'border-stone-100 text-stone-500'
                    }`}>
                      <span className="select-none text-[10px] mt-0.5">🌐</span>
                      <p className="italic">
                        {m.bodyTranslated}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick templates */}
        <div className="px-6 py-2 bg-white border-t border-stone-100 flex gap-2 overflow-x-auto select-none">
          {templates[lang].map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleSend(tpl)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] font-bold text-stone-600 shrink-0 cursor-pointer transition-colors disabled:opacity-50"
            >
              {tpl}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-stone-150 flex items-center gap-3">
          {/* Language selector toggle button */}
          <button
            onClick={() => setLang(lang === 'FR' ? 'RN' : 'FR')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              lang === 'FR'
                ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                : 'border-amber-600 bg-amber-50/45 text-amber-955'
            }`}
            title="Langue de rédaction du message"
          >
            <span>{lang === 'FR' ? 'FR 🇫🇷' : 'RN 🇷🇺'}</span>
          </button>

          <input 
            type="text" 
            placeholder={lang === 'FR' ? 'Écrire un message en français...' : 'Andika ubutumwa mu kirundi...'}
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend(text)
            }}
            disabled={loading}
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none"
          />

          <button
            onClick={() => handleSend(text)}
            disabled={loading || !text.trim()}
            className="rounded-xl bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-sm px-4 py-2.5 shadow-md cursor-pointer transition-colors shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>

      </div>
    </div>
  )
}

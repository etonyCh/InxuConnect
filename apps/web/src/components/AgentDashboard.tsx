'use client'
import { useState, useEffect } from 'react'

interface AgentDashboardProps {
  token: string
}

export default function AgentDashboard({ token }: AgentDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions'>('overview')

  // Formulaire d'enregistrement d'hôte
  const [hostName, setHostName] = useState('')
  const [hostEmail, setHostEmail] = useState('')
  const [hostPhone, setHostPhone] = useState('')
  const [hostPassword, setHostPassword] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)

  // Formulaire d'annonce hôte
  const [listingOwnerId, setListingOwnerId] = useState('')
  const [listingTitle, setListingTitle] = useState('')
  const [listingDesc, setListingDesc] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingCity, setListingCity] = useState('Bujumbura')
  const [listingAddress, setListingAddress] = useState('')
  const [listingLoading, setListingLoading] = useState(false)
  const [listingSuccess, setListingSuccess] = useState<string | null>(null)
  const [listingError, setListingError] = useState<string | null>(null)

  // Formulaire d'annonce hote - nouveaux champs pour enrichir l'onboarding et le price coach
  const [listingBedrooms, setListingBedrooms] = useState('1')
  const [listingBathrooms, setListingBathrooms] = useState('1')
  const [hasGenerator, setHasGenerator] = useState(false)
  const [hasWaterTank, setHasWaterTank] = useState(false)
  const [hasStarlink, setHasStarlink] = useState(false)
  const [hasSecurityGuard, setHasSecurityGuard] = useState(false)
  const [hasKitchen, setHasKitchen] = useState(false)

  // États du Price Coach
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null)
  const [priceJustification, setPriceJustification] = useState<string>('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachError, setCoachError] = useState<string | null>(null)

  const handlePriceCoach = async () => {
    if (!listingCity) {
      setCoachError("Veuillez sélectionner une ville d'abord.")
      return
    }
    setCoachLoading(true)
    setCoachError(null)
    setSuggestedPrice(null)
    setPriceJustification('')

    const amenities: string[] = []
    if (hasGenerator) amenities.push('generator')
    if (hasWaterTank) amenities.push('water_tank')
    if (hasStarlink) amenities.push('starlink')
    if (hasSecurityGuard) amenities.push('security_guard')
    if (hasKitchen) amenities.push('kitchen')

    try {
      const res = await fetch('http://localhost:3001/api/listings/price-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city: listingCity,
          bedrooms: parseInt(listingBedrooms, 10),
          bathrooms: parseInt(listingBathrooms, 10),
          amenities
        })
      })

      const resData = await res.json() as any
      if (res.ok) {
        setSuggestedPrice(resData.suggestedPrice)
        setPriceJustification(resData.justification)
      } else {
        setCoachError(resData.error || 'Erreur lors du calcul de la suggestion.')
      }
    } catch (err) {
      setCoachError('Erreur réseau lors de la consultation du Price Coach.')
    } finally {
      setCoachLoading(false)
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3001/api/agents/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
        if (dashboardData.hosts?.length > 0 && !listingOwnerId) {
          setListingOwnerId(dashboardData.hosts[0].id)
        }
      } else {
        const err = await res.json() as any
        setError(err.error || 'Erreur lors du chargement des données.')
      }
    } catch (e) {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [token])

  const handleRegisterHost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostName || !hostEmail || !hostPhone || !hostPassword) {
      setRegisterError('Veuillez remplir tous les champs.')
      return
    }
    setRegisterLoading(true)
    setRegisterError(null)
    setRegisterSuccess(null)

    try {
      const res = await fetch('http://localhost:3001/api/agents/register-host', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hostName,
          email: hostEmail,
          phone: hostPhone,
          password: hostPassword
        })
      })

      const resData = await res.json() as any
      if (res.ok) {
        setRegisterSuccess(`Hôte ${resData.user.name} enregistré avec succès !`)
        setHostName('')
        setHostEmail('')
        setHostPhone('')
        setHostPassword('')
        loadDashboardData()
      } else {
        setRegisterError(resData.error || 'Erreur lors de la création de l\'hôte.')
      }
    } catch (err) {
      setRegisterError('Erreur réseau.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listingOwnerId || !listingTitle || !listingDesc || !listingPrice || !listingCity) {
      setListingError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setListingLoading(true)
    setListingError(null)
    setListingSuccess(null)

    const amenities: string[] = []
    if (hasGenerator) amenities.push('generator')
    if (hasWaterTank) amenities.push('water_tank')
    if (hasStarlink) amenities.push('starlink')
    if (hasSecurityGuard) amenities.push('security_guard')
    if (hasKitchen) amenities.push('kitchen')

    try {
      const res = await fetch('http://localhost:3001/api/agents/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: listingTitle,
          description: listingDesc,
          price: parseInt(listingPrice, 10),
          city: listingCity,
          address: listingAddress,
          ownerId: listingOwnerId,
          bedrooms: parseInt(listingBedrooms, 10),
          bathrooms: parseInt(listingBathrooms, 10),
          surchargeGenerator: hasGenerator ? 5000 : 0,
          amenities
        })
      })

      const resData = await res.json() as any
      if (res.ok) {
        setListingSuccess('Annonce créée avec succès !')
        setListingTitle('')
        setListingDesc('')
        setListingPrice('')
        setListingAddress('')
        setListingBedrooms('1')
        setListingBathrooms('1')
        setHasGenerator(false)
        setHasWaterTank(false)
        setHasStarlink(false)
        setHasSecurityGuard(false)
        setHasKitchen(false)
        setSuggestedPrice(null)
        setPriceJustification('')
        loadDashboardData()
      } else {
        setListingError(resData.error || 'Erreur lors de la création de l\'annonce.')
      }
    } catch (err) {
      setListingError('Erreur réseau.')
    } finally {
      setListingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm font-bold text-stone-500 animate-pulse">Chargement du portail agent...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <p className="text-red-800 font-semibold">⚠️ {error}</p>
        <button onClick={loadDashboardData} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Statistiques clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center text-xl font-bold">
            🤝
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Hôtes parrainés</span>
            <span className="text-2xl font-black text-stone-800">{data?.hostsCount || 0}</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center text-xl font-bold">
            💰
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Commissions perçues</span>
            <span className="text-2xl font-black text-emerald-800">
              {data?.totalEarnedBif?.toLocaleString() || 0} <span className="text-xs font-bold text-stone-450">BIF</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center text-xl font-bold">
            🏡
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Logements créés</span>
            <span className="text-2xl font-black text-stone-800">
              {data?.hosts?.reduce((sum: number, h: any) => sum + (h.listings?.length || 0), 0) || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Onglets navigation */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Gestion des Hôtes & Annonces
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'commissions'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Historique des Commissions
        </button>
      </div>

      {/* Rendu Onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaires à gauche */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Formulaire Enregistrement Hôte */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-stone-850 flex items-center gap-1.5">
                <span>🤝 Onboarder un nouvel Hôte</span>
              </h3>

              <form onSubmit={handleRegisterHost} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                />
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={hostEmail}
                  onChange={(e) => setHostEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                />
                <input
                  type="tel"
                  placeholder="Téléphone (ex: +25779000000)"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                />
                <input
                  type="password"
                  placeholder="Mot de passe temporaire"
                  value={hostPassword}
                  onChange={(e) => setHostPassword(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                />

                {registerError && <p className="text-[11px] text-red-600 font-semibold">⚠️ {registerError}</p>}
                {registerSuccess && <p className="text-[11px] text-emerald-800 font-semibold">✅ {registerSuccess}</p>}

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {registerLoading ? 'Enregistrement...' : 'Enregistrer Hôte'}
                </button>
              </form>
            </div>

            {/* Formulaire Création Annonce */}
            {data?.hosts?.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-850 flex items-center gap-1.5">
                  <span>🏡 Créer une Annonce pour un Hôte</span>
                </h3>

                <form onSubmit={handleCreateListing} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Sélectionner l'Hôte</label>
                    <select
                      value={listingOwnerId}
                      onChange={(e) => setListingOwnerId(e.target.value)}
                      className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-white"
                    >
                      {data.hosts.map((h: any) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Titre de l'annonce"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                  />
                  <textarea
                    placeholder="Description de base du logement"
                    rows={2}
                    value={listingDesc}
                    onChange={(e) => setListingDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Chambres</label>
                      <input
                        type="number"
                        min="1"
                        value={listingBedrooms}
                        onChange={(e) => setListingBedrooms(e.target.value)}
                        className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Salles de bain</label>
                      <input
                        type="number"
                        min="1"
                        value={listingBathrooms}
                        onChange={(e) => setListingBathrooms(e.target.value)}
                        className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Ville</label>
                      <select
                        value={listingCity}
                        onChange={(e) => setListingCity(e.target.value)}
                        className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-white"
                      >
                        <option value="Bujumbura">Bujumbura</option>
                        <option value="Gitega">Gitega</option>
                        <option value="Ngozi">Ngozi</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Adresse</label>
                      <input
                        type="text"
                        placeholder="Adresse"
                        value={listingAddress}
                        onChange={(e) => setListingAddress(e.target.value)}
                        className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 py-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Équipements (Garanties Burundi)</label>
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                      <label className="flex items-center gap-1.5 p-2 border border-stone-200 rounded-xl bg-stone-50/30 cursor-pointer hover:bg-stone-50">
                        <input type="checkbox" checked={hasGenerator} onChange={(e) => setHasGenerator(e.target.checked)} className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800" />
                        <span className="truncate">🔋 Groupe</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-2 border border-stone-200 rounded-xl bg-stone-50/30 cursor-pointer hover:bg-stone-50">
                        <input type="checkbox" checked={hasWaterTank} onChange={(e) => setHasWaterTank(e.target.checked)} className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800" />
                        <span className="truncate">💧 Citerne</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-2 border border-stone-200 rounded-xl bg-stone-50/30 cursor-pointer hover:bg-stone-50">
                        <input type="checkbox" checked={hasStarlink} onChange={(e) => setHasStarlink(e.target.checked)} className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800" />
                        <span className="truncate">📡 Starlink</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-2 border border-stone-200 rounded-xl bg-stone-50/30 cursor-pointer hover:bg-stone-50">
                        <input type="checkbox" checked={hasSecurityGuard} onChange={(e) => setHasSecurityGuard(e.target.checked)} className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800" />
                        <span className="truncate">🛡️ Gardien</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-2 border border-stone-200 rounded-xl bg-stone-50/30 cursor-pointer hover:bg-stone-50 col-span-2">
                        <input type="checkbox" checked={hasKitchen} onChange={(e) => setHasKitchen(e.target.checked)} className="rounded border-stone-300 text-emerald-800 focus:ring-emerald-800" />
                        <span>🍳 Cuisine Equipée</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide block">Prix par nuit (BIF)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Prix par nuit (BIF)"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        className="flex-1 text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/30"
                      />
                      <button
                        type="button"
                        onClick={handlePriceCoach}
                        disabled={coachLoading}
                        className="px-3 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        {coachLoading ? 'Calcul...' : '💡 Suggérer'}
                      </button>
                    </div>
                  </div>

                  {coachError && <p className="text-[10px] text-red-650 font-semibold">⚠️ {coachError}</p>}
                  
                  {suggestedPrice !== null && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center font-bold text-emerald-850">
                        <span>💡 Prix suggéré :</span>
                        <span>{suggestedPrice.toLocaleString()} BIF</span>
                      </div>
                      {priceJustification && (
                        <p className="text-[10px] text-stone-600 leading-relaxed bg-white/80 p-2 rounded-lg border border-stone-150 whitespace-pre-line max-h-40 overflow-y-auto">
                          {priceJustification}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setListingPrice(String(suggestedPrice))}
                        className="w-full py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                      >
                        Appliquer ce prix
                      </button>
                    </div>
                  )}

                  {listingError && <p className="text-[11px] text-red-600 font-semibold">⚠️ {listingError}</p>}
                  {listingSuccess && <p className="text-[11px] text-emerald-800 font-semibold">✅ {listingSuccess}</p>}

                  <button
                    type="submit"
                    disabled={listingLoading}
                    className="w-full py-2 bg-teal-800 hover:bg-teal-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {listingLoading ? 'Création...' : 'Créer l\'Annonce'}
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Liste des hôtes parrainés et annonces à droite */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">
              Hôtes gérés ({data?.hosts?.length || 0})
            </h3>

            {data?.hosts?.length > 0 ? (
              <div className="space-y-4">
                {data.hosts.map((host: any) => (
                  <div key={host.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-stone-850">{host.name}</h4>
                        <span className="text-[11px] text-stone-400 font-medium">📞 {host.phone} &bull; ✉️ {host.email}</span>
                      </div>
                      <span className="text-[10px] bg-stone-50 text-stone-600 rounded-full px-2 py-0.5 font-bold uppercase ring-1 ring-stone-200">
                        Badge : {host.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Logements créés :</span>
                      {host.listings?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {host.listings.map((l: any) => (
                            <div key={l.id} className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 space-y-1">
                              <h5 className="text-xs font-bold text-stone-800 truncate">{l.title}</h5>
                              <div className="flex justify-between items-center text-[10px] text-stone-550 font-medium">
                                <span>📍 {l.city}</span>
                                <span className="font-bold text-emerald-800">{l.price.toLocaleString()} BIF/nuit</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 italic">Aucune annonce créée pour le moment.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-stone-250 rounded-2xl p-12 text-center text-stone-450 italic">
                Aucun hôte parrainé pour le moment. Utilisez le formulaire à gauche pour enregistrer votre premier hôte.
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wide">
            Historique des encaissements de commissions
          </h3>

          {data?.commissions?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Référence Réservation</th>
                    <th className="pb-3 font-semibold">Montant perçu (BIF)</th>
                    <th className="pb-3 font-semibold">Date d'encaissement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-600">
                  {data.commissions.map((comm: any) => (
                    <tr key={comm.id}>
                      <td className="py-3 font-mono font-bold text-stone-800">#{comm.bookingId.substring(0, 8)}</td>
                      <td className="py-3 font-black text-emerald-800">+{comm.amount.toLocaleString()} BIF</td>
                      <td className="py-3 text-stone-450">
                        {new Date(comm.createdAt).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 italic">
              Aucune commission encaissée pour le moment. Les commissions seront créditées lors du check-in d'une réservation de vos hôtes parrainés.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

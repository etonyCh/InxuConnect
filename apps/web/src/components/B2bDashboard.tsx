'use client'
import { useState, useEffect } from 'react'

interface B2bDashboardProps {
  token: string
}

export default function B2bDashboard({ token }: B2bDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'policy' | 'employees' | 'invoice'>('overview')

  // Formulaire d'enregistrement de l'entreprise
  const [companyName, setCompanyName] = useState('')
  const [companyTier, setCompanyTier] = useState<'PME' | 'ONG_INTERNATIONALE'>('PME')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  // Formulaire d'invitation d'employé
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Formulaire de modification de la politique de voyage
  const [policyMaxPrice, setPolicyMaxPrice] = useState('')
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policySuccess, setPolicySuccess] = useState<string | null>(null)
  const [policyError, setPolicyError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/b2b/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const dashboardData = await res.json()
        setData(dashboardData)
        if (dashboardData.company) {
          setPolicyMaxPrice(String(dashboardData.company.maxPricePerNight))
        }
      } else {
        const err = await res.json() as any
        // Si l'utilisateur n'a pas d'entreprise, on n'affiche pas une erreur bloquante
        if (res.status === 403) {
          setData({ notRegistered: true })
        } else {
          setError(err.error || 'Erreur lors du chargement des données B2B.')
        }
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

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName) {
      setRegisterError('Veuillez renseigner le nom de votre entreprise.')
      return
    }
    setRegisterLoading(true)
    setRegisterError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/b2b/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: companyName,
          tier: companyTier
        })
      })

      if (res.ok) {
        await loadDashboardData()
      } else {
        const resData = await res.json() as any
        setRegisterError(resData.error || 'Erreur lors de l\'enregistrement.')
      }
    } catch (err) {
      setRegisterError('Erreur réseau.')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) {
      setInviteError('Veuillez renseigner l\'adresse email de l\'employé.')
      return
    }
    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/b2b/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail
        })
      })

      const resData = await res.json() as any
      if (res.ok) {
        setInviteSuccess(resData.message || 'Employé rattaché avec succès !')
        setInviteEmail('')
        loadDashboardData()
      } else {
        setInviteError(resData.error || 'Erreur lors du rattachement de l\'employé.')
      }
    } catch (err) {
      setInviteError('Erreur réseau.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!policyMaxPrice) {
      setPolicyError('Veuillez spécifier un tarif limite.')
      return
    }
    setPolicyLoading(true)
    setPolicyError(null)
    setPolicySuccess(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/b2b/policy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          maxPricePerNight: parseInt(policyMaxPrice, 10)
        })
      })

      const resData = await res.json() as any
      if (res.ok) {
        setPolicySuccess('Politique de voyage mise à jour avec succès !')
        loadDashboardData()
      } else {
        setPolicyError(resData.error || 'Erreur lors de la mise à jour.')
      }
    } catch (err) {
      setPolicyError('Erreur réseau.')
    } finally {
      setPolicyLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm font-bold text-stone-500 animate-pulse">Chargement du portail B2B d'entreprise...</span>
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

  // Écran d'enregistrement B2B si non inscrit
  if (data?.notRegistered) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">🏢</span>
          <h2 className="text-xl font-black text-stone-900">Enregistrer votre Organisation sur InzuConnect</h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Logez vos équipes en mission, centralisez la facturation mensuelle et configurez vos politiques de remboursement en 60 secondes.
          </p>
        </div>

        <form onSubmit={handleRegisterCompany} className="space-y-4 pt-4 border-t border-stone-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Nom de l'Entreprise / ONG</label>
            <input
              type="text"
              placeholder="ex: Burundi Agro Development"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Niveau d'Abonnement SaaS</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${companyTier === 'PME' ? 'border-emerald-800 bg-emerald-50/10' : 'border-stone-200 hover:bg-stone-50'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="tier" checked={companyTier === 'PME'} onChange={() => setCompanyTier('PME')} className="text-emerald-800 focus:ring-emerald-800" />
                  <span className="text-xs font-bold text-stone-850">Abonnement PME</span>
                </div>
                <span className="text-[10px] text-stone-450 mt-1">50 000 BIF / mois. Recommandé pour les PME locales burundaises.</span>
              </label>

              <label className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${companyTier === 'ONG_INTERNATIONALE' ? 'border-emerald-800 bg-emerald-50/10' : 'border-stone-200 hover:bg-stone-50'}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="tier" checked={companyTier === 'ONG_INTERNATIONALE'} onChange={() => setCompanyTier('ONG_INTERNATIONALE')} className="text-emerald-800 focus:ring-emerald-800" />
                  <span className="text-xs font-bold text-stone-850">Abonnement ONG / Int.</span>
                </div>
                <span className="text-[10px] text-stone-450 mt-1">200 000 BIF / mois. Adapté aux ONG internationales et multinationales.</span>
              </label>
            </div>
          </div>

          {registerError && <p className="text-xs text-red-600 font-semibold">⚠️ {registerError}</p>}

          <button
            type="submit"
            disabled={registerLoading}
            className="w-full py-3 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {registerLoading ? 'Enregistrement en cours...' : 'Enregistrer mon Organisation'}
          </button>
        </form>
      </div>
    )
  }

  const { company, employees, employeesCount, bookings, billingSummary } = data

  return (
    <div className="space-y-8">
      {/* Profil Entreprise et Entête */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/10 mb-2">
            Abonnement {company.tier === 'PME' ? 'PME' : 'ONG Internationale'}
          </span>
          <h1 className="text-2xl font-black text-stone-900">{company.name}</h1>
          <p className="text-xs text-stone-400 font-semibold mt-1">ID Client Corporate : {company.id}</p>
        </div>
        <div className="text-right bg-stone-50 border border-stone-200 rounded-2xl p-4 shrink-0">
          <span className="block text-[10px] text-stone-400 font-bold uppercase tracking-wider">Forfait SaaS Mensuel</span>
          <span className="text-lg font-black text-emerald-800">{company.saasFee.toLocaleString()} BIF</span>
        </div>
      </div>

      {/* Cartes Statistique B2B */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center text-xl font-bold">
            📊
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Facture consolidée ce mois</span>
            <span className="text-2xl font-black text-emerald-800">
              {billingSummary.totalInvoiceAmount.toLocaleString()} <span className="text-xs font-bold text-stone-450">BIF</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center text-xl font-bold">
            👥
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Voyageurs actifs</span>
            <span className="text-2xl font-black text-stone-800">{employeesCount || 0}</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-xl flex items-center justify-center text-xl font-bold">
            🏡
          </div>
          <div>
            <span className="block text-xs text-stone-400 font-bold uppercase tracking-wider">Réservations d'équipe</span>
            <span className="text-2xl font-black text-stone-800">{billingSummary.bookingsCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Onglets navigation */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Réservations de l'Équipe
        </button>
        <button
          onClick={() => setActiveTab('policy')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'policy' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Politique de Voyage
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'employees' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Gestion de l'Équipe ({employeesCount})
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'invoice' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-stone-400 hover:text-stone-600'
          }`}
        >
          Facture Consolidée
        </button>
      </div>

      {/* Rendu des Onglets */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-850">Historique des Séjours d'Équipe</h3>
          
          {bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    <th className="pb-3">Voyageur</th>
                    <th className="pb-3">Logement / Ville</th>
                    <th className="pb-3">Dates</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-right">Montant (BIF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-600">
                  {bookings.map((b: any) => (
                    <tr key={b.id}>
                      <td className="py-3">
                        <span className="font-bold text-stone-800 block">{b.guest.name}</span>
                        <span className="text-[10px] text-stone-400">{b.guest.email}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-stone-800 block truncate max-w-xs">{b.listing.title}</span>
                        <span className="text-[10px] text-stone-400">📍 {b.listing.city}</span>
                      </td>
                      <td className="py-3 font-medium">
                        {new Date(b.checkIn).toLocaleDateString('fr-FR')} &rarr; {new Date(b.checkOut).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                          b.status === 'CHECKED_IN' || b.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                            : b.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-800 ring-red-650/20'
                            : 'bg-stone-50 text-stone-600 ring-stone-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-emerald-850">
                        {b.totalPrice.toLocaleString()} BIF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 italic">
              Aucune réservation enregistrée pour vos collaborateurs pour le moment.
            </div>
          )}
        </div>
      )}

      {activeTab === 'policy' && (
        <div className="max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-850">Politique de Remboursement & Tarifs</h3>
            <p className="text-[11px] text-stone-400 font-medium">
              Définissez la limite de prix par nuitée autorisée pour les déplacements de vos collaborateurs au Burundi.
            </p>
          </div>

          <form onSubmit={handleUpdatePolicy} className="space-y-4 pt-3 border-t border-stone-100">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Plafond par Nuitée (BIF)</label>
              <input
                type="number"
                value={policyMaxPrice}
                onChange={(e) => setPolicyMaxPrice(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/20"
              />
            </div>

            {policyError && <p className="text-xs text-red-655 font-semibold">⚠️ {policyError}</p>}
            {policySuccess && <p className="text-xs text-emerald-800 font-semibold">✅ {policySuccess}</p>}

            <button
              type="submit"
              disabled={policyLoading}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {policyLoading ? 'Mise à jour...' : 'Sauvegarder les Changements'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inviter un employé */}
          <div className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-850">Inviter un Collaborateur</h3>
            
            <form onSubmit={handleInviteEmployee} className="space-y-3 pt-2 border-t border-stone-100">
              <input
                type="email"
                placeholder="Adresse email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-200 rounded-xl focus:border-emerald-800 focus:outline-none bg-stone-50/20"
              />

              {inviteError && <p className="text-xs text-red-655 font-semibold">⚠️ {inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-800 font-semibold">✅ {inviteSuccess}</p>}

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {inviteLoading ? 'Rattachement...' : 'Inviter l\'employé'}
              </button>
            </form>
          </div>

          {/* Liste des employés */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-850">Employés Enregistrés ({employees?.length || 0})</h3>
            
            {employees && employees.length > 0 ? (
              <div className="divide-y divide-stone-100 text-xs">
                {employees.map((emp: any) => (
                  <div key={emp.id} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-stone-800 block text-sm">{emp.name}</span>
                      <span className="text-[10px] text-stone-400 font-medium">{emp.email} &bull; {emp.phone || 'Pas de numéro'}</span>
                    </div>
                    <span className="text-[10px] bg-stone-50 text-stone-550 border border-stone-200 rounded-full px-2 py-0.5 font-bold uppercase">
                      Employé
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-stone-400 italic text-xs">
                Aucun collaborateur enregistré. Utilisez le panneau de gauche pour en rattacher un.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'invoice' && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-8">
          {/* Entête de facture */}
          <div className="flex justify-between items-start border-b border-stone-100 pb-6">
            <div>
              <h2 className="text-lg font-black text-stone-900">FACTURE CONSOLIDÉE</h2>
              <span className="text-xs text-stone-450 block font-semibold mt-0.5">InzuConnect Corporate Services</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-stone-800">{company.name}</span>
              <span className="text-[10px] text-stone-400 block mt-0.5">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          {/* Tableau recap */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Détails des consommations du mois :</span>
            
            <div className="divide-y divide-stone-100 text-xs text-stone-600">
              {/* SaaS Subscription */}
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-stone-800 block">Forfait Abonnement SaaS InzuConnect</span>
                  <span className="text-[10px] text-stone-400">Période mensuelle récurrente - Tier : {company.tier}</span>
                </div>
                <span className="font-semibold text-stone-800">{billingSummary.saasFee.toLocaleString()} BIF</span>
              </div>

              {/* Individual Bookings */}
              {bookings && bookings.filter((b: any) => b.status !== 'CANCELLED').map((b: any) => (
                <div key={b.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-stone-800 block">Mission de {b.guest.name} - #{b.id.substring(0, 8)}</span>
                    <span className="text-[10px] text-stone-400">{b.listing.title} &bull; 📍 {b.listing.city}</span>
                  </div>
                  <span className="font-semibold text-stone-800">{b.totalPrice.toLocaleString()} BIF</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-stone-200 pt-6 flex justify-between items-center">
            <div>
              <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Montant total consolidé</span>
              <span className="text-[10px] text-stone-450 block mt-0.5">Net à payer via wallet Corporate EcoCash/Lumicash</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-800">{billingSummary.totalInvoiceAmount.toLocaleString()} BIF</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

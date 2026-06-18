'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function NewProperty() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    city: 'Bujumbura',
    address: '',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    taxiMotoDistance: '',
    surchargeGenerator: '0',
    description: '',
    amenities: [] as string[]
  })
  const [mapPosition, setMapPosition] = useState<{lat: number, lng: number} | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  if (!session) return null
  
  const role = (session?.user as any)?.role
  if (role !== 'HOST' && role !== 'ADMIN') {
    router.push('/')
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const files = Array.from(e.target.files)
    setUploadingPhotos(true)
    setError('')

    const token = (session as any)?.accessToken

    try {
      const newPhotos: string[] = []
      for (const file of files) {
        // 1. Get Presigned URL
        const presignRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/listings/media/presigned`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type
          })
        })

        if (!presignRes.ok) throw new Error("Erreur d'obtention de l'URL d'upload")
        const presignData = await presignRes.json()
        const { uploadUrl, publicUrl } = presignData

        // 2. Upload to S3/R2 or Mock
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        })

        if (!uploadRes.ok) throw new Error("Erreur lors de l'envoi du fichier")
        
        newPhotos.push(publicUrl)
      }

      setPhotos(prev => [...prev, ...newPhotos])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const token = (session as any)?.accessToken

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          city: formData.city,
          address: formData.address,
          price: parseInt(formData.price),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          taxiMotoDistance: formData.taxiMotoDistance ? parseInt(formData.taxiMotoDistance) : undefined,
          surchargeGenerator: parseInt(formData.surchargeGenerator),
          description: formData.description,
          amenities: formData.amenities,
          latitude: mapPosition?.lat,
          longitude: mapPosition?.lng,
          photos: photos,
          country: 'Burundi',
          currency: 'BIF'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }

      router.push('/host/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50/50 pb-20">
      <Header />
      
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50">
            <h1 className="text-2xl font-extrabold text-stone-900">Ajouter une propriété</h1>
            <p className="text-sm text-stone-500 mt-1">Remplissez les informations de base de votre logement au Burundi.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 text-sm p-4 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Titre de l'annonce</label>
              <input 
                required
                type="text" 
                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                placeholder="Ex: Superbe appartement au centre-ville"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ville</label>
                <select 
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border appearance-none"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                >
                  <option value="Bujumbura">Bujumbura</option>
                  <option value="Gitega">Gitega</option>
                  <option value="Ngozi">Ngozi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Adresse précise <span className="text-stone-400 font-normal">(Optionnelle)</span></label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  placeholder="Ex: Quartier Rohero I, Avenue de l'Indépendance"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Prix par nuit (BIF)</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  placeholder="Ex: 50000"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Frais additionnels - Groupe électrogène (BIF)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  placeholder="Ex: 5000"
                  value={formData.surchargeGenerator}
                  onChange={e => setFormData({...formData, surchargeGenerator: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Chambres</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  value={formData.bedrooms}
                  onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Salles de bain</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  value={formData.bathrooms}
                  onChange={e => setFormData({...formData, bathrooms: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Distance arrêt Taxi-Moto (m)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border" 
                  placeholder="Ex: 50"
                  value={formData.taxiMotoDistance}
                  onChange={e => setFormData({...formData, taxiMotoDistance: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Localisation sur la carte <span className="text-stone-400 font-normal">(Cliquez pour placer le repère)</span></label>
              <MapPicker position={mapPosition} setPosition={setMapPosition} />
              {mapPosition && (
                <p className="text-xs text-stone-500 mt-2">
                  Coordonnées : {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-3">Équipements (Amenities)</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: 'generator', label: '🔌 Groupe électrogène' },
                  { id: 'water_tank', label: '💧 Citerne d\'eau' },
                  { id: 'starlink', label: '📡 Internet Starlink' }
                ].map(amenity => (
                  <label key={amenity.id} className="flex items-center gap-2 cursor-pointer bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, amenities: [...formData.amenities, amenity.id]})
                        } else {
                          setFormData({...formData, amenities: formData.amenities.filter(a => a !== amenity.id)})
                        }
                      }}
                    />
                    {amenity.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Description <span className="text-stone-400 font-normal">(Optionnelle, sera optimisée par l'IA)</span></label>
              <textarea 
                rows={4}
                className="w-full rounded-xl border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none border resize-none" 
                placeholder="Décrivez votre logement..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Photos</label>
              
              {/* Uploaded Photos Grid */}
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative h-24 w-24 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
                      <img src={url} alt={`Photo ${idx + 1}`} className="object-cover w-full h-full" />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              <div className={`relative border-2 border-dashed rounded-2xl transition-colors flex justify-center items-center p-8 ${uploadingPhotos ? 'border-emerald-300 bg-emerald-50' : 'border-stone-300 bg-stone-50 hover:bg-stone-100'}`}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingPhotos}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-center text-stone-500">
                  {uploadingPhotos ? (
                    <span className="text-sm font-bold animate-pulse text-emerald-600">Chargement des images...</span>
                  ) : (
                    <>
                      <span className="block text-3xl mb-2">📸</span>
                      <span className="text-sm font-bold text-stone-700">Cliquez ou glissez vos photos ici</span>
                      <span className="block text-xs mt-1">PNG, JPG, JPEG</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => router.push('/host/dashboard')}
                className="px-6 py-3 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-100 transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Publier l\'annonce'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}

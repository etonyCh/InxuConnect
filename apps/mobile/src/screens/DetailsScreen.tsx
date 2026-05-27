import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'

interface DetailsScreenProps {
  route: any
  navigation: any
  apiBaseUrl: string
}

export default function DetailsScreen({ route, navigation, apiBaseUrl }: DetailsScreenProps) {
  const { listingId } = route.params
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Staging Virtuel 3D States
  const [staging, setStaging] = useState<any>(null)
  const [wallColor, setWallColor] = useState('#F5F5F4')
  const [floorTexture, setFloorTexture] = useState('wood')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/listings/${listingId}`)
      if (res.ok) {
        const data = await res.json()
        setListing(data)
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer les détails de ce logement.')
        navigation.goBack()
      }
    } catch (e) {
      Alert.alert('Erreur', 'Connexion réseau impossible.')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const fetchStaging = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/listings/${listingId}/staging`)
      if (res.ok) {
        const data = await res.json()
        if (data.stagingRequest) {
          setStaging(data.stagingRequest)
          if (data.stagingRequest.scene) {
            setWallColor(data.stagingRequest.scene.wallColor || '#F5F5F4')
            setFloorTexture(data.stagingRequest.scene.floorTexture || 'wood')
          }
        }
      }
    } catch (e) {
      // Ignorer
    }
  }

  useEffect(() => {
    fetchDetails()
    fetchStaging()
  }, [listingId])

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#065F46" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    )
  }

  if (!listing) return null

  const hasGenerator = listing.amenities?.some((a: any) => a.name === 'generator')
  const hasWaterTank = listing.amenities?.some((a: any) => a.name === 'water_tank')
  const hasStarlink = listing.amenities?.some((a: any) => a.name === 'starlink')
  const hasSecurity = listing.amenities?.some((a: any) => a.name === 'security_guard')
  const hasKitchen = listing.amenities?.some((a: any) => a.name === 'kitchen')

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Visual */}
        <View style={styles.visualHeader}>
          <Text style={styles.letter}>{listing.city[0]}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>&larr; Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.city}>📍 {listing.city} {listing.address ? `• ${listing.address}` : ''}</Text>
          
          <View style={styles.divider} />

          {/* Price details */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>TARIF PAR NUITÉE</Text>
              <Text style={styles.priceValue}>{listing.price.toLocaleString()} BIF</Text>
            </View>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Logement vérifié</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description || 'Aucune description fournie.'}</Text>

          <View style={styles.divider} />

          {/* Burundi Specific Amenities */}
          <Text style={styles.sectionTitle}>Équipements de confiance</Text>
          <View style={styles.amenityList}>
            <View style={[styles.amenityItem, hasGenerator ? styles.amenityActive : styles.amenityInactive]}>
              <Text style={styles.amenityEmoji}>🔋</Text>
              <Text style={styles.amenityText}>Groupe Électrogène (Moteri)</Text>
            </View>
            <View style={[styles.amenityItem, hasWaterTank ? styles.amenityActive : styles.amenityInactive]}>
              <Text style={styles.amenityEmoji}>💧</Text>
              <Text style={styles.amenityText}>Citerne d'eau (Ikigega)</Text>
            </View>
            <View style={[styles.amenityItem, hasStarlink ? styles.amenityActive : styles.amenityInactive]}>
              <Text style={styles.amenityEmoji}>📲</Text>
              <Text style={styles.amenityText}>Connexion Starlink</Text>
            </View>
            <View style={[styles.amenityItem, hasSecurity ? styles.amenityActive : styles.amenityInactive]}>
              <Text style={styles.amenityEmoji}>👮</Text>
              <Text style={styles.amenityText}>Sécurité & Gardiennage</Text>
            </View>
            <View style={[styles.amenityItem, hasKitchen ? styles.amenityActive : styles.amenityInactive]}>
              <Text style={styles.amenityEmoji}>🍳</Text>
              <Text style={styles.amenityText}>Cuisine privée équipée</Text>
            </View>
          </View>

          {/* Section Staging 3D */}
          {staging && staging.scene && (
            <View style={styles.stagingContainer}>
              <Text style={styles.sectionTitle}>✨ Visite 3D interactive (IA)</Text>
              <Text style={styles.stagingSubtitle}>Aménagement virtuel en 3D généré par IA</Text>
              
              {/* Room Grid */}
              <View style={[styles.roomGrid, { backgroundColor: wallColor }]}>
                {/* Floor rendering */}
                <View style={[styles.floorPlan, { backgroundColor: floorTexture === 'wood' ? '#B45309' : floorTexture === 'tile' ? '#E5E7EB' : '#D1D5DB' }]}>
                  {staging.scene.furniture.map((item: any, idx: number) => {
                    const isLit = item.type === 'bed'
                    const isArmoire = item.type === 'wardrobe'
                    return (
                      <TouchableOpacity 
                        key={idx}
                        style={[
                          styles.furniturePiece,
                          {
                            backgroundColor: selectedItem?.type === item.type ? '#10B981' : item.color,
                            width: isLit ? 70 : isArmoire ? 50 : 25,
                            height: isLit ? 85 : isArmoire ? 30 : 25,
                            left: 70 + item.position.x * 35,
                            top: 70 + item.position.z * 35,
                          }
                        ]}
                        onPress={() => setSelectedItem(item)}
                      >
                        <Text style={styles.furnitureEmoji}>
                          {item.type === 'bed' ? '🛏️' : item.type === 'wardrobe' ? '🚪' : '🗄️'}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Selected info */}
              {selectedItem && (
                <View style={styles.selectedFurnitureCard}>
                  <Text style={styles.selectedFurnitureTitle}>
                    {selectedItem.type === 'bed' ? '🛏️ Lit Double King Size' : selectedItem.type === 'wardrobe' ? '🚪 Armoire Penderie' : '🗄️ Table de Chevet'}
                  </Text>
                  <Text style={styles.selectedFurnitureDesc}>Aménagement IA • Position : {selectedItem.position.x}m, {selectedItem.position.z}m</Text>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}>
                    <Text style={styles.closeDetailsText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Customizer */}
              <Text style={styles.customizerLabel}>Personnaliser les murs :</Text>
              <View style={styles.colorRow}>
                {['#F5F5F4', '#E2E8F0', '#D1FAE5', '#FEF3C7'].map(c => (
                  <TouchableOpacity 
                    key={c} 
                    style={[styles.colorBubble, { backgroundColor: c, borderColor: wallColor === c ? '#10B981' : '#E7E5E4' }]} 
                    onPress={() => setWallColor(c)}
                  />
                ))}
              </View>

              <Text style={styles.customizerLabel}>Sol :</Text>
              <View style={styles.textureRow}>
                {[{id:'wood',l:'Bois'}, {id:'tile',l:'Carrelage'}, {id:'carpet',l:'Moquette'}].map(t => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.textureBtn, floorTexture === t.id ? styles.textureBtnActive : styles.textureBtnInactive]} 
                    onPress={() => setFloorTexture(t.id)}
                  >
                    <Text style={[styles.textureBtnText, floorTexture === t.id ? styles.textureBtnTextActive : styles.textureBtnTextInactive]}>
                      {t.l}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => navigation.navigate('Booking', { listingId, price: listing.price })}
        >
          <Text style={styles.bookButtonText}>Réserver ce logement</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    paddingBottom: 100,
  },
  visualHeader: {
    height: 200,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letter: {
    fontSize: 90,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.15)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 6,
  },
  city: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#065F46',
  },
  badgeContainer: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#44403C',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: '#57534E',
    lineHeight: 20,
    fontWeight: '500',
  },
  amenityList: {
    gap: 8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  amenityActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  amenityInactive: {
    backgroundColor: '#FAFAF9',
    borderColor: '#E7E5E4',
    opacity: 0.5,
  },
  amenityEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#27272A',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E7E5E4',
    padding: 16,
  },
  bookButton: {
    width: '100%',
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  stagingContainer: {
    marginTop: 20,
    backgroundColor: '#FAFAF9',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  stagingSubtitle: {
    fontSize: 11,
    color: '#78716C',
    marginBottom: 12,
  },
  roomGrid: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  floorPlan: {
    width: 200,
    height: 200,
    borderRadius: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  furniturePiece: {
    position: 'absolute',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  furnitureEmoji: {
    fontSize: 14,
  },
  selectedFurnitureCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  selectedFurnitureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  selectedFurnitureDesc: {
    fontSize: 10,
    color: '#78716C',
    marginTop: 2,
  },
  closeDetailsText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  customizerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  textureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textureBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  textureBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#065F46',
  },
  textureBtnInactive: {
    backgroundColor: '#fff',
    borderColor: '#E7E5E4',
  },
  textureBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textureBtnTextActive: {
    color: '#065F46',
  },
  textureBtnTextInactive: {
    color: '#78716C',
  },
})

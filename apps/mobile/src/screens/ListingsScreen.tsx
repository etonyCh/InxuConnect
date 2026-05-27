import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'

interface ListingsScreenProps {
  token: string
  apiBaseUrl: string
  onLogout: () => void
  navigation: any
}

export default function ListingsScreen({ token, apiBaseUrl, onLogout, navigation }: ListingsScreenProps) {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchListings = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBaseUrl}/api/listings`)
      if (res.ok) {
        const result = await res.json()
        setListings(result.data || [])
      } else {
        setError('Impossible de récupérer les logements.')
      }
    } catch (e) {
      setError('Erreur de connexion avec l\'API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const renderItem = ({ item }: { item: any }) => {
    const hasGenerator = item.amenities?.some((a: any) => a.name === 'generator')
    const hasWaterTank = item.amenities?.some((a: any) => a.name === 'water_tank')
    const hasStarlink = item.amenities?.some((a: any) => a.name === 'starlink')

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Details', { listingId: item.id })}
      >
        <View style={styles.cardMedia}>
          <Text style={styles.cardLetter}>{item.city[0]}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.price.toLocaleString()} BIF</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCity}>📍 {item.city} {item.address ? `• ${item.address}` : ''}</Text>

          <View style={styles.badgeRow}>
            {hasGenerator && <Text style={styles.badge}>🔋 Moteri</Text>}
            {hasWaterTank && <Text style={styles.badge}>💧 Ikigega</Text>}
            {hasStarlink && <Text style={styles.badge}>📲 Starlink</Text>}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#065F46" />
        <Text style={styles.loadingText}>Chargement des logements...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>InzuConnect</Text>
          <Text style={styles.headerSubtitle}>Logements vérifiés au Burundi 🇧🇮</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchListings}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchListings}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun logement disponible.</Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
  },
  logoutText: {
    color: '#78716C',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  cardMedia: {
    height: 140,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardLetter: {
    fontSize: 64,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.15)',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardCity: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
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
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#065F46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#78716C',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 40,
  },
})

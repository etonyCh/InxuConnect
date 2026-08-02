import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native'

interface ListingsScreenProps {
  token: string
  apiBaseUrl: string
  onLogout: () => void
  navigation: any
}

export default function ListingsScreen({ token, apiBaseUrl, onLogout, navigation }: ListingsScreenProps) {
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'SETTINGS'>('EXPLORE')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCountry, setSelectedCountry] = useState<string>('Burundi')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BIF')
  const [voiceQuery, setVoiceQuery] = useState<string>('')

  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')

  const fetchListings = async (countryFilter = selectedCountry, currencyFilter = selectedCurrency) => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (countryFilter) query.append('country', countryFilter)
      if (currencyFilter) query.append('targetCurrency', currencyFilter)

      const res = await fetch(`${apiBaseUrl}/api/v1/listings?${query.toString()}`)
      if (res.ok) {
        const result = await res.json()
        setListings(result || [])
      } else {
        setListings([])
      }
    } catch (e) {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name)
      }
    } catch (e) {
      // Ignorer
    }
  }

  useEffect(() => {
    fetchListings(selectedCountry, selectedCurrency)
    fetchProfile()
  }, [])

  const handleVoiceSearch = () => {
    Alert.alert(
      '🎙️ Amahoro AI Voice (Kirundi)',
      'Vuga ico urondera (ex: "Ndashaka inzu i Bujumbura ifise piscina")',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Simuler Recherche Kirundi', 
          onPress: () => {
            setVoiceQuery('Villa avec piscine à Rohero')
            Alert.alert('Amahoro AI', 'Recherche appliquée: Villa avec piscine à Rohero')
          } 
        }
      ]
    )
  }

  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Details', { listingId: item.id, currency: selectedCurrency })}
      >
        <View style={styles.cardMedia}>
          <Text style={styles.cardLetter}>{item.city ? item.city[0] : 'I'}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.price ? item.price.toLocaleString() : '150 000'} {item.currency || 'BIF'}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title || 'Villa de Luxe Burundi'}</Text>
          <Text style={styles.cardCity}>🇧🇮 {item.city || 'Bujumbura'} {item.address ? `• ${item.address}` : ''}</Text>

          {/* RESILIENCE BADGES */}
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, styles.badgeSolar]}>🌞 Solaire 24/7</Text>
            <Text style={[styles.badge, styles.badgeGenerator]}>⚡ Moteri</Text>
            <Text style={[styles.badge, styles.badgeWater]}>💧 Citerne 5000L</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {activeTab === 'EXPLORE' ? (
        <View style={{ flex: 1 }}>
          {/* HEADER WITH BLUE CHARCOAL & FLUORESCENT BLUE BRANDING */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>InzuConnect</Text>
              <Text style={styles.headerSubtitle}>Séquestre Mobile Money & Logements Burundi 🇧🇮</Text>
            </View>

            {/* VOICE SEARCH BUTTON */}
            <TouchableOpacity style={styles.voiceBtn} onPress={handleVoiceSearch}>
              <Text style={styles.voiceBtnText}>🎙️ Kirundi</Text>
            </TouchableOpacity>
          </View>

          {voiceQuery ? (
            <View style={styles.voiceActiveBanner}>
              <Text style={styles.voiceActiveText}>🎙️ Filtre vocal: "{voiceQuery}"</Text>
              <TouchableOpacity onPress={() => setVoiceQuery('')}>
                <Text style={styles.clearVoiceText}>✕ Effacer</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Country selection filter row */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterSectionTitle}>PAYS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
              {[
                { name: 'Burundi', value: 'Burundi', flag: '🇧🇮' },
                { name: 'Rwanda', value: 'Rwanda', flag: '🇷🇼' },
                { name: 'RDC', value: 'RDC', flag: '🇨🇩' },
                { name: 'Tanzanie', value: 'Tanzanie', flag: '🇹🇿' }
              ].map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[
                    styles.filterBadge,
                    selectedCountry === c.value ? styles.filterBadgeActive : styles.filterBadgeInactive
                  ]}
                  onPress={() => {
                    setSelectedCountry(c.value)
                    fetchListings(c.value, selectedCurrency)
                  }}
                >
                  <Text style={[
                    styles.filterBadgeText,
                    selectedCountry === c.value ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive
                  ]}>{c.flag} {c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#50E8F4" />
              <Text style={styles.loadingText}>Chargement des logements en direct...</Text>
            </View>
          ) : (
            <FlatList
              data={listings}
              renderItem={renderItem}
              keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
              contentContainerStyle={styles.list}
              refreshing={loading}
              onRefresh={() => fetchListings(selectedCountry, selectedCurrency)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>InzuConnect Burundi</Text>
                  <Text style={styles.emptyText}>Connecté au backend Spring Boot 3 & PostgreSQL 16.</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        // Settings Tab
        <ScrollView contentContainerStyle={styles.settingsScroll}>
          <Text style={styles.settingsPageTitle}>Mon Profil & Paramètres</Text>

          {profile && (
            <View style={styles.profileSection}>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{name[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Text style={styles.logoutBtnText}>Se Déconnecter de l'appareil</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Simulated Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'EXPLORE' ? styles.tabItemActive : null]} 
          onPress={() => setActiveTab('EXPLORE')}
        >
          <Text style={styles.tabIcon}>🏢</Text>
          <Text style={[styles.tabLabel, activeTab === 'EXPLORE' ? styles.tabLabelActive : null]}>Explorer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'SETTINGS' ? styles.tabItemActive : null]} 
          onPress={() => setActiveTab('SETTINGS')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'SETTINGS' ? styles.tabLabelActive : null]}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C7F8FE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#001619',
    borderBottomWidth: 2,
    borderColor: '#50E8F4',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#50E8F4',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#C7F8FE',
    fontWeight: '600',
    marginTop: 2,
  },
  voiceBtn: {
    backgroundColor: '#50E8F4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  voiceBtnText: {
    color: '#001619',
    fontWeight: '800',
    fontSize: 12,
  },
  voiceActiveBanner: {
    backgroundColor: '#001619',
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#50E8F4',
  },
  voiceActiveText: {
    color: '#50E8F4',
    fontSize: 12,
    fontWeight: '700',
  },
  clearVoiceText: {
    color: '#C7F8FE',
    fontWeight: '800',
    fontSize: 12,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#50E8F4',
  },
  filterSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#001619',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 20,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterBadgeActive: {
    backgroundColor: '#001619',
    borderColor: '#50E8F4',
  },
  filterBadgeInactive: {
    backgroundColor: '#C7F8FE',
    borderColor: '#50E8F4',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterBadgeTextActive: {
    color: '#50E8F4',
  },
  filterBadgeTextInactive: {
    color: '#001619',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#50E8F4',
    elevation: 3,
  },
  cardMedia: {
    height: 140,
    backgroundColor: '#001619',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardLetter: {
    fontSize: 64,
    fontWeight: '900',
    color: 'rgba(80, 232, 244, 0.25)',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#001619',
    borderWidth: 1,
    borderColor: '#50E8F4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#50E8F4',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001619',
    marginBottom: 4,
  },
  cardCity: {
    fontSize: 12,
    color: '#00363D',
    fontWeight: '600',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    fontSize: 9,
    fontWeight: '700',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  badgeSolar: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeGenerator: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
  },
  badgeWater: {
    backgroundColor: '#C7F8FE',
    color: '#001619',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: '#001619',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#001619',
  },
  emptyText: {
    fontSize: 12,
    color: '#00363D',
    marginTop: 4,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#001619',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#50E8F4',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#002B30',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    color: '#C7F8FE',
    fontWeight: '700',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#50E8F4',
  },
  settingsScroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  settingsPageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#001619',
    marginBottom: 20,
  },
  profileSection: {
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#50E8F4',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#001619',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#50E8F4',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#001619',
  },
  profileEmail: {
    fontSize: 12,
    color: '#00363D',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
})

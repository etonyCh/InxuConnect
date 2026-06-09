import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, Switch, Alert, TextInput } from 'react-native'

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
  const [error, setError] = useState<string | null>(null)

  // Regional/currency filtering states
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BIF')

  // Profile states
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const fetchListings = async (countryFilter = selectedCountry, currencyFilter = selectedCurrency) => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams()
      if (countryFilter) query.append('country', countryFilter)
      if (currencyFilter) query.append('targetCurrency', currencyFilter)

      const res = await fetch(`${apiBaseUrl}/api/listings?${query.toString()}`)
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

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name)
        setPhone(data.user.phone || '')
        setRole(data.user.role)
      }
    } catch (e) {
      // Ignorer
    }
  }

  useEffect(() => {
    fetchListings(selectedCountry, selectedCurrency)
    fetchProfile()
  }, [])

  const handleUpdateProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone, role })
      })
      if (res.ok) {
        Alert.alert('Succès', 'Votre profil a été mis à jour avec succès.')
        fetchProfile()
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le profil.')
      }
    } catch (e) {
      Alert.alert('Erreur', 'Erreur de connexion au serveur.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleToggleSavings = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/host/savings/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchProfile()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const renderItem = ({ item }: { item: any }) => {
    const hasGenerator = item.amenities?.some((a: any) => a.name === 'generator')
    const hasWaterTank = item.amenities?.some((a: any) => a.name === 'water_tank')
    const hasStarlink = item.amenities?.some((a: any) => a.name === 'starlink')
    const flag = item.country === 'Rwanda' ? '🇷🇼' : item.country === 'RDC' ? '🇨🇩' : item.country === 'Tanzanie' ? '🇹🇿' : '🇧🇮'

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Details', { listingId: item.id, currency: selectedCurrency })}
      >
        <View style={styles.cardMedia}>
          <Text style={styles.cardLetter}>{item.city[0]}</Text>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{item.price.toLocaleString()} {item.currency || 'BIF'}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCity}>{flag} {item.city} {item.address ? `• ${item.address}` : ''}</Text>

          <View style={styles.badgeRow}>
            {hasGenerator && <Text style={styles.badge}>🔋 Moteri</Text>}
            {hasWaterTank && <Text style={styles.badge}>💧 Ikigega</Text>}
            {hasStarlink && <Text style={styles.badge}>📲 Starlink</Text>}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {activeTab === 'EXPLORE' ? (
        // Explore Listings Tab
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>InzuConnect</Text>
              <Text style={styles.headerSubtitle}>Logements de confiance dans la région 🌍</Text>
            </View>
            <View style={styles.headerStatusGlow} />
          </View>

          {/* Country selection filter row */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterSectionTitle}>PAYS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
              {[
                { name: 'Tous', value: '', flag: '🌍' },
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

          {/* Currency selection filter row */}
          <View style={styles.currencyFilterContainer}>
            <Text style={styles.filterSectionTitle}>DEVISE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterScrollContent}>
              {['BIF', 'RWF', 'USD', 'TZS'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyBadge,
                    selectedCurrency === curr ? styles.currencyBadgeActive : styles.currencyBadgeInactive
                  ]}
                  onPress={() => {
                    setSelectedCurrency(curr)
                    fetchListings(selectedCountry, curr)
                  }}
                >
                  <Text style={[
                    styles.currencyBadgeText,
                    selectedCurrency === curr ? styles.currencyBadgeTextActive : styles.currencyBadgeTextInactive
                  ]}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loadingText}>Chargement des logements...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchListings(selectedCountry, selectedCurrency)}>
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
              onRefresh={() => fetchListings(selectedCountry, selectedCurrency)}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun logement disponible.</Text>
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
              {/* User Avatar banner */}
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{name[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                  <View style={styles.badgeWrapper}>
                    <Text style={styles.badgeText}>🏆 {profile.badge}</Text>
                  </View>
                </View>
              </View>

              {/* Edit form */}
              <View style={styles.settingsForm}>
                <Text style={styles.inputLabel}>Nom Complet</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Téléphone</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+257 79 XXXXXX"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Rôle de l'utilisateur</Text>
                <View style={styles.selectorRow}>
                  {['GUEST', 'HOST', 'AGENT'].map(r => (
                    <TouchableOpacity 
                      key={r}
                      style={[styles.selectorBtn, role === r ? styles.selectorBtnActive : styles.selectorBtnInactive]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.selectorBtnText, role === r ? styles.selectorBtnTextActive : styles.selectorBtnTextInactive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={savingProfile}>
                  <Text style={styles.saveBtnText}>{savingProfile ? 'Mise à jour...' : 'Sauvegarder les modifications'}</Text>
                </TouchableOpacity>
              </View>

              {/* Micro-Savings Toggle (For Hosts) */}
              {profile.role === 'HOST' && (
                <View style={styles.savingsCard}>
                  <View style={styles.savingsInfo}>
                    <Text style={styles.savingsCardTitle}>💰 Cagnotte d'Épargne</Text>
                    <Text style={styles.savingsAmount}>{profile.savingsBalance.toLocaleString()} BIF</Text>
                  </View>
                  <View style={styles.savingsToggleRow}>
                    <Text style={styles.savingsToggleLabel}>Micro-épargne automatique (10%)</Text>
                    <Switch
                      value={profile.microSavingsEnabled}
                      onValueChange={handleToggleSavings}
                      trackColor={{ false: '#767577', true: '#10B981' }}
                      thumbColor={profile.microSavingsEnabled ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                <Text style={styles.logoutBtnText}>Se Déconnecter de l'appareil</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Simulated Tab Bar (Coherent Navigation System) */}
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
    backgroundColor: '#F5F5F4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46', // Emerald
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
    marginTop: 2,
  },
  headerStatusGlow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  currencyFilterContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
  },
  filterSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A8A29E',
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
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  filterBadgeInactive: {
    backgroundColor: '#FAFAF9',
    borderColor: '#E7E5E4',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  filterBadgeTextInactive: {
    color: '#57534E',
  },
  currencyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  currencyBadgeActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  currencyBadgeInactive: {
    backgroundColor: '#FAFAF9',
    borderColor: '#E7E5E4',
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  currencyBadgeTextActive: {
    color: '#fff',
  },
  currencyBadgeTextInactive: {
    color: '#57534E',
  },
  list: {
    padding: 20,
    paddingBottom: 100, // Make room for tab bar
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardMedia: {
    height: 150,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardLetter: {
    fontSize: 70,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.15)',
  },
  priceTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
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
    padding: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 4,
  },
  cardCity: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
    marginBottom: 14,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
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
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#E7E5E4',
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabItemActive: {
    backgroundColor: '#FAFAF9',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#78716C',
    fontWeight: '700',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#065F46',
  },
  settingsScroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  settingsPageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 20,
  },
  profileSection: {
    width: '100%',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#047857',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  profileEmail: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  settingsForm: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    height: 45,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1C1917',
    fontWeight: '600',
    marginBottom: 10,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  selectorBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#065F46',
  },
  selectorBtnInactive: {
    backgroundColor: '#FAFAF9',
    borderColor: '#E7E5E4',
  },
  selectorBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectorBtnTextActive: {
    color: '#065F46',
  },
  selectorBtnTextInactive: {
    color: '#78716C',
  },
  saveBtn: {
    backgroundColor: '#065F46',
    borderRadius: 12,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  savingsCard: {
    backgroundColor: '#065F46',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  savingsInfo: {
    marginBottom: 12,
  },
  savingsCardTitle: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '700',
  },
  savingsAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginTop: 2,
  },
  savingsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  savingsToggleLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
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

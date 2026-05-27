import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'

interface BookingScreenProps {
  route: any
  navigation: any
  token: string
  apiBaseUrl: string
}

export default function BookingScreen({ route, navigation, token, apiBaseUrl }: BookingScreenProps) {
  const { listingId, price } = route.params
  const [checkIn, setCheckIn] = useState('2026-06-01')
  const [checkOut, setCheckOut] = useState('2026-06-05')
  const [paymentMethod, setPaymentMethod] = useState<'ECOCASH' | 'LUMICASH'>('ECOCASH')
  const [phone, setPhone] = useState('+25779000000')
  const [loading, setLoading] = useState(false)

  // Calcule la durée
  const d1 = new Date(checkIn)
  const d2 = new Date(checkOut)
  const nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)))
  const totalPrice = price * nights

  const handleBooking = async () => {
    if (!checkIn || !checkOut || !phone) {
      Alert.alert('Erreur', 'Veuillez renseigner tous les champs obligatoires.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          totalPrice,
          paymentMethod,
          phone
        })
      })

      const data = await res.json() as any
      if (res.ok) {
        Alert.alert(
          'Réservation Initiée',
          `Votre réservation #${data.id.substring(0, 8)} a été créée au statut PENDING.\nUn paiement Mobile Money (${paymentMethod}) a été initié pour ${totalPrice.toLocaleString()} BIF.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Listings')
            }
          ]
        )
      } else {
        Alert.alert('Échec de la réservation', data.error || 'Une erreur est survenue.')
      }
    } catch (e) {
      Alert.alert('Erreur Réseau', 'Impossible d\'envoyer la demande.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>&larr; Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Réservation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formCard}>
          {/* Tarification */}
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Prix par nuit :</Text>
            <Text style={styles.recapValue}>{price.toLocaleString()} BIF</Text>
          </View>
          <View style={styles.recapRow}>
            <Text style={styles.recapLabel}>Nombre de nuits :</Text>
            <Text style={styles.recapValue}>{nights} nuit(s)</Text>
          </View>
          <View style={styles.recapDivider} />
          <View style={styles.recapRow}>
            <Text style={styles.totalLabel}>TOTAL NET À PAYER :</Text>
            <Text style={styles.totalValue}>{totalPrice.toLocaleString()} BIF</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DATE D'ARRIVÉE (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={checkIn}
            onChangeText={setCheckIn}
            placeholder="2026-06-01"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DATE DE DÉPART (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={checkOut}
            onChangeText={setCheckOut}
            placeholder="2026-06-05"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>TÉLÉPHONE DU PORTEFEUILLE MOBILE MONEY</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+257 79 XXXXXX"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>MOYEN DE PAIEMENT</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'ECOCASH' ? styles.radioActive : styles.radioInactive]}
              onPress={() => setPaymentMethod('ECOCASH')}
            >
              <Text style={[styles.radioText, paymentMethod === 'ECOCASH' ? styles.radioTextActive : styles.radioTextInactive]}>
                EcoCash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'LUMICASH' ? styles.radioActive : styles.radioInactive]}
              onPress={() => setPaymentMethod('LUMICASH')}
            >
              <Text style={[styles.radioText, paymentMethod === 'LUMICASH' ? styles.radioTextActive : styles.radioTextInactive]}>
                Lumicash
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleBooking} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Valider et payer avec mobile money</Text>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E7E5E4',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  scroll: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recapLabel: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  recapValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
  },
  recapDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#44403C',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1C1917',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioItem: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  radioActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#065F46',
  },
  radioInactive: {
    backgroundColor: '#fff',
    borderColor: '#E7E5E4',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioTextActive: {
    color: '#065F46',
  },
  radioTextInactive: {
    color: '#78716C',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E7E5E4',
  },
  confirmButton: {
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})

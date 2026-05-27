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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>&larr; Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Réservation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Invoice Recap Card */}
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceTitle}>Détail de la facturation</Text>
          
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

        {/* Inputs */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date d'arrivée (AAAA-MM-JJ)</Text>
          <TextInput
            style={styles.input}
            value={checkIn}
            onChangeText={setCheckIn}
            placeholder="2026-06-01"
            placeholderTextColor="#A8A29E"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de départ (AAAA-MM-JJ)</Text>
          <TextInput
            style={styles.input}
            value={checkOut}
            onChangeText={setCheckOut}
            placeholder="2026-06-05"
            placeholderTextColor="#A8A29E"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Numéro Mobile Money (Lumicash/EcoCash)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+257 79 XXXXXX"
            placeholderTextColor="#A8A29E"
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Moyen de paiement</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'ECOCASH' ? styles.radioActive : styles.radioInactive]}
              onPress={() => setPaymentMethod('ECOCASH')}
            >
              <Text style={styles.paymentMethodEmoji}>📲</Text>
              <Text style={[styles.radioText, paymentMethod === 'ECOCASH' ? styles.radioTextActive : styles.radioTextInactive]}>
                EcoCash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioItem, paymentMethod === 'LUMICASH' ? styles.radioActive : styles.radioInactive]}
              onPress={() => setPaymentMethod('LUMICASH')}
            >
              <Text style={styles.paymentMethodEmoji}>💸</Text>
              <Text style={[styles.radioText, paymentMethod === 'LUMICASH' ? styles.radioTextActive : styles.radioTextInactive]}>
                Lumicash
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Confirm */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleBooking} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Valider et Payer via Mobile Money</Text>
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
    paddingTop: 55,
    paddingBottom: 20,
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
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1917',
  },
  scroll: {
    padding: 24,
    paddingBottom: 120,
  },
  invoiceCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  invoiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#44403C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recapLabel: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '600',
  },
  recapValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  recapDivider: {
    height: 1,
    backgroundColor: '#F5F5F4',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C1917',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#1C1917',
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioItem: {
    flex: 1,
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    gap: 6,
  },
  paymentMethodEmoji: {
    fontSize: 16,
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
    fontWeight: '800',
  },
  radioTextActive: {
    color: '#065F46',
  },
  radioTextInactive: {
    color: '#78716C',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E7E5E4',
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#065F46',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})

import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'

interface LoginScreenProps {
  onLoginSuccess: (token: string, apiBaseUrl: string) => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState('http://10.0.2.2:3001')
  const [phone, setPhone] = useState('+25779000000')
  const [otpCode, setOtpCode] = useState('')
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE')
  const [loading, setLoading] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (res.ok) {
        Alert.alert(
          'Code OTP Envoyé',
          `Un code OTP de simulation a été généré.\n(Pour le test, vérifiez les logs API ou utilisez le code de test local).`
        )
        setStep('OTP')
      } else {
        const errText = await res.text()
        Alert.alert('Erreur', `Impossible d'envoyer l'OTP : ${errText}`)
      }
    } catch (e) {
      Alert.alert('Erreur Réseau', 'Veuillez vérifier l\'adresse IP de l\'API.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      Alert.alert('Erreur', 'Veuillez saisir le code OTP.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode })
      })

      const data = await res.json() as any
      if (res.ok && data.accessToken) {
        onLoginSuccess(data.accessToken, apiBaseUrl)
      } else {
        Alert.alert('Erreur', data.error || 'Code OTP invalide.')
      }
    } catch (e) {
      Alert.alert('Erreur Réseau', 'Connexion impossible.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      {/* Decorative Top Glows */}
      <View style={styles.glowGreen} />
      <View style={styles.glowAmber} />

      <View style={styles.card}>
        {/* Brand Logo/Visual */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Inzu<Text style={styles.logoSubtext}>Connect</Text></Text>
          <View style={styles.logoDot} />
        </View>

        <Text style={styles.title}>Confiance & Sécurité</Text>
        <Text style={styles.subtitle}>Le premier réseau de logements vérifiés au Burundi 🇧🇮</Text>

        {step === 'PHONE' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Numéro de Téléphone</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.phoneIcon}>📞</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+257 79 XXXXXX"
                placeholderTextColor="#A8A29E"
                keyboardType="phone-pad"
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Demander un code OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Code OTP de validation</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.phoneIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="Saisir les 6 chiffres"
                placeholderTextColor="#A8A29E"
                keyboardType="number-pad"
              />
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Valider et Se Connecter</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('PHONE')}>
              <Text style={styles.secondaryButtonText}>&larr; Modifier le numéro</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Config button */}
        <TouchableOpacity style={styles.configToggle} onPress={() => setShowConfig(!showConfig)}>
          <Text style={styles.configToggleText}>
            {showConfig ? '⚙️ Masquer les options réseau' : '⚙️ Paramètres IP de l\'API'}
          </Text>
        </TouchableOpacity>

        {showConfig && (
          <View style={styles.configBox}>
            <Text style={styles.configLabel}>ADRESSE IP API BACKEND</Text>
            <TextInput
              style={styles.configInput}
              value={apiBaseUrl}
              onChangeText={setApiBaseUrl}
              placeholder="http://10.0.2.2:3001"
              placeholderTextColor="#A8A29E"
            />
            <Text style={styles.configHint}>
              * Emulateur Android : http://10.0.2.2:3001{'\n'}
              * Appareil physique : http://[IP_PC_WIFI]:3001
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#1C1917', // Elegant Dark Background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    position: 'relative',
  },
  glowGreen: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    filter: 'blur(40px)',
  },
  glowAmber: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    filter: 'blur(50px)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#272522', // Sleek dark card
    borderRadius: 32,
    padding: 30,
    borderWidth: 1,
    borderColor: '#3E3C39',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  logoSubtext: {
    color: '#10B981', // Emerald green
  },
  logoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B', // Amber
    marginLeft: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D6D3D1',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1917',
    borderWidth: 1,
    borderColor: '#44403C',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  phoneIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#059669', // Emerald button
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '105%',
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#A8A29E',
    fontSize: 13,
    fontWeight: '700',
  },
  configToggle: {
    marginTop: 20,
    padding: 8,
  },
  configToggleText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  configBox: {
    width: '100%',
    backgroundColor: '#1C1917',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#44403C',
  },
  configLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A8A29E',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  configInput: {
    backgroundColor: '#272522',
    borderWidth: 1,
    borderColor: '#44403C',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#fff',
    marginBottom: 8,
  },
  configHint: {
    fontSize: 10,
    color: '#78716C',
    lineHeight: 14,
  },
})

import React, { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'

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
        const data = await res.json() as any
        Alert.alert(
          'Code OTP Envoyé',
          `Un code OTP de simulation a été généré en base de données.\n(Pour le test, vérifiez les logs API ou utilisez le code de test local).`
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🏢</Text>
        <Text style={styles.title}>InzuConnect Mobile</Text>
        <Text style={styles.subtitle}>Le premier réseau de confiance de logements au Burundi.</Text>

        {step === 'PHONE' ? (
          <View style={styles.form}>
            <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+257 79 XXXXXX"
              keyboardType="phone-pad"
            />
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
            <Text style={styles.label}>CODE OTP REÇU</Text>
            <TextInput
              style={styles.input}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Saisir le code"
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Valider et Se Connecter</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('PHONE')}>
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Configuration IP */}
        <TouchableOpacity style={styles.configToggle} onPress={() => setShowConfig(!showConfig)}>
          <Text style={styles.configToggleText}>
            {showConfig ? 'Masquer la configuration API' : 'Configurer l\'adresse IP de l\'API'}
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
            />
            <Text style={styles.configHint}>
              * Utilisez http://10.0.2.2:3001 sur l'émulateur Android.{'\n'}
              * Pour un vrai téléphone, utilisez l'IP Wi-Fi de votre ordinateur (ex: http://192.168.1.34:3001).
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1C1917',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#065F46', // emerald-800
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#78716C',
    fontSize: 13,
    fontWeight: '600',
  },
  configToggle: {
    marginTop: 16,
    padding: 8,
  },
  configToggleText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  configBox: {
    width: '100%',
    backgroundColor: '#FAFAF9',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  configLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#78716C',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  configInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: '#1C1917',
    marginBottom: 8,
  },
  configHint: {
    fontSize: 10,
    color: '#A8A29E',
    lineHeight: 14,
  },
})

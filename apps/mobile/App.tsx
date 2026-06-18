import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import * as Sentry from '@sentry/react-native';

// Initialization of Sentry (Requires a DSN later)
Sentry.init({
  dsn: "TODO_ADD_DSN_HERE",
  tracesSampleRate: 1.0,
});

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import BookingScreen from './src/screens/BookingScreen';

const Stack = createNativeStackNavigator();

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://10.0.2.2:8080'); // Pointing to Spring Boot
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSecureData() {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        const storedIp = await SecureStore.getItemAsync('api_base_url');
        if (storedToken) setToken(storedToken);
        if (storedIp) setApiBaseUrl(storedIp);
      } catch (error) {
        Sentry.captureException(error);
      } finally {
        setIsReady(true);
      }
    }
    loadSecureData();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null);
  };

  if (!isReady) {
    return null; // Or a Splash Screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {token === null ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={async (tok, ip) => {
                  await SecureStore.setItemAsync('auth_token', tok);
                  await SecureStore.setItemAsync('api_base_url', ip);
                  setApiBaseUrl(ip);
                  setToken(tok);
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Listings">
            {(props) => (
              <ListingsScreen
                {...props}
                token={token}
                apiBaseUrl={apiBaseUrl}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Details">
            {(props) => (
              <DetailsScreen
                {...props}
                apiBaseUrl={apiBaseUrl}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Booking">
            {(props) => (
              <BookingScreen
                {...props}
                token={token}
                apiBaseUrl={apiBaseUrl}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default Sentry.wrap(App);

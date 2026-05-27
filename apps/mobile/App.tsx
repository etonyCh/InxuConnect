import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import BookingScreen from './src/screens/BookingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('http://10.0.2.2:3001');

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {token === null ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={(tok, ip) => {
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
                onLogout={() => setToken(null)}
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
